import { openAsBlob } from 'node:fs';
import MP3Tag from 'mp3tag.js';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { workerData, parentPort } from 'worker_threads';
import { WebContents } from 'electron';

let read = 0;
let currentAlbum = '';
let currentArist = '';
let currentGenres = '';
let currentHash = -1;

let mainWindow: WebContents;

let EXIT_FLAG = false;

const savedGenres = new Map();
const genreSeparator = ', ';
let ignoredGenres = new Set();

const count = 9999;
let index = 0;

const generateHash = (input: string): number => {
  let hash = 0;
  for (const char of input) {
    hash = (hash << 5) - hash + char.charCodeAt(0);
    hash |= 0;
  }
  return hash;
};
// convert given string to PascalCase
const pascalCase = (input: string): string => {
  const newString = input.replace(/(\w)(\w*)/g, function (g0, g1, g2) {
    return g1.toUpperCase() + g2.toLowerCase();
  });
  return newString;
};

// load data from given last.fm link using cheerio
async function loadWebpage(link: string) {
  let genres: string[] = [];

  try {
    const response = await fetch(link);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.text();
    const $ = cheerio.load(data);
    const $data = $('.tags-list:first').find('li');

    // select iterator at beginning of tags list
    let $curr = $data.first();
    for (let i = 0; i < $data.length; i++) {
      let genre = $curr.text();
      var hasNumber = /\d/;
      // if tag name is not a number AND is not in ignore list,
      if (!hasNumber.test(genre) && !ignoredGenres.has(genre.replaceAll(' ', ''))) {
        // convert to pascal case
        genres.push(pascalCase(genre));
      }
      // continue iterating through tags
      $curr = $curr.next();
    }
  } catch (error) {
    console.error('Fetch failed:', error);
  }

  // const tags = await cheerio.fromURL(link).then(($) => {
  //   // select element where albums tags are stored
  //   const $data = $('.tags-list:first').find('li');

  //   // select iterator at beginning of tags list
  //   let $curr = $data.first();
  //   for (let i = 0; i < $data.length; i++) {
  //     let genre = $curr.text();
  //     var hasNumber = /\d/;
  //     // if tag name is not a number AND is not in ignore list,
  //     if (!hasNumber.test(genre) && !ignoredGenres.has(genre.replaceAll(' ', ''))) {
  //       // convert to pascal case
  //       genres.push(pascalCase(genre));
  //     }
  //     // continue iterating through tags
  //     $curr = $curr.next();
  //   }
  //   return genres;
  // });
  return genres;
}

//TODO: if more than one hyphen exists, save all version of artist - artist (eg. Dinosaur Pile-Up - albumname)

// separate folder name into album and artist (only works for one format currently: 'Artist - Album')
function parseFolderName(folder: string) {
  let artist = '';

  let c = folder.slice(0, 1);
  do {
    artist += c;
    folder = folder.slice(1);
    c = folder.slice(0, 1);
  } while (c !== '-');

  currentArist = artist.trim();
  currentAlbum = folder.slice(1).trim();
  console.log('album:', currentAlbum);
}

async function getGenres(link: string) {
  let result = false;
  let pass = false;
  let retryAttempts = 0;
  let error = '';

  while (true) {
    console.log('loop');
    try {
      console.log('loading...', link);
      await loadWebpage(
        link
        //   , {
        //   lowerCaseTags: true,
        //   lowerCaseAttributeNames: true
        // }
      ).then((data) => {
        currentGenres = '';
        data.sort();
        for (let i = 0; i < data.length; i++) {
          if (i > 0) {
            currentGenres += genreSeparator;
          }
          currentGenres += data[i].trim();
        }

        pass = true;
        result = true;
      });
    } catch (e) {
      retryAttempts++;
      pass = false;
      error = e;
      // console.log('error', e);
      const newLink = e.input;
      console.log('newLink', newLink);
      if (newLink !== undefined) {
        console.log('not undefined');
        link = 'https://www.last.fm' + e.input;
        console.log('link = https://www.last.fm' + e.input);
      }
      // else {
      //   break;
      // }
    }

    console.log('pass', pass);
    console.log('retryAttempts', retryAttempts);
    if (pass || retryAttempts > 5) {
      if (!pass) {
        console.log('fail with error', error);
      } else {
        console.log('pass');
      }
      break;
    }
  }

  return result;
}

async function getDefaultGenres(filepath: string) {
  const dir = await fs.promises.readdir(filepath, { withFileTypes: true });

  for (const file of dir) {
    if (path.extname(file.name) === '.mp3') {
      const blob = await openAsBlob(filepath + file.name);
      const arrayBuffer = await blob.arrayBuffer();
      const mp3tag = new MP3Tag(arrayBuffer);
      mp3tag.read();
      savedGenres.set(currentHash, mp3tag.tags.v2!!.TCON);
      break;
    }
  }
}

function loadJsonFile(dataPath: string) {
  if (dataPath) {
    const filePath = path.join(dataPath, 'ignoredGenres.json');

    try {
      const rawData = fs.readFileSync(filePath, 'utf8');
      const jsonData = JSON.parse(rawData).ignore;
      return jsonData;
    } catch (err) {
      console.error('Error reading JSON file:', err);
    }
  }
}

async function run(window: WebContents, filePath: string, userDataPath: string) {
  EXIT_FLAG = false;
  mainWindow = window;

  ignoredGenres = new Set(loadJsonFile(userDataPath));

  try {
    return await getFolders(filePath);
  } catch (e) {
    console.error('e', e);
  }
}

async function getFolders(filepath: string) {
  const dir = await fs.promises.readdir(filepath, { withFileTypes: true });
  const folders = dir.filter((item) => !/(^|\/)\.[^\/\.]/g.test(item.name));
  const numFolders = folders.length;

  //TODO: data type
  const folderPaths: any[] = [];

  //TODO: deal with folders insde album (ie: disc 1 disc 2)
  for (let i = 0; i < numFolders; i++) {
    const currFolder = folders[i];
    folderPaths.push({ path: filepath, album: currFolder.name });

    console.log('scanning', currFolder.name);
    if (index++ === count) {
      break;
    }
    parseFolderName(currFolder.name);
    const artist = currentArist.replaceAll(' ', '+');
    const album = currentAlbum.replaceAll(' ', '+');
    const link = 'https://www.last.fm/music/' + artist + '/' + album;
    currentHash = generateHash(currFolder.name);
    const success = await getGenres(link).then((result) => {
      console.log('genres loaded');
      return result;
    });
    if (success) {
      await getDefaultGenres(`${filepath}${currFolder.name}/`);
      if (currentGenres === '') {
        mainWindow.send('recv-album', {
          title: currFolder.name,
          genres: savedGenres.get(currentHash)
        });
      } else {
        mainWindow.send('recv-album', { title: currFolder.name, genres: currentGenres });
      }
    } else {
      console.log('could not load', currFolder.name);
    }
  }

  return folderPaths;
}

//generator function to retrieve files in given folder
async function* getFiles(filepath: string) {
  // load directory of given folder
  const dir = await fs.promises.readdir(filepath, { withFileTypes: true });
  // create list of only file names
  const entries = dir.filter((file) => !/(^|\/)\.[^\/\.]/g.test(file.name));
  const length = entries.length;

  for (let i = 0; i < length; i++) {
    const currentFile = entries[i];
    // only return files of type mp3 (more filetypes to be supported later)
    if (path.extname(currentFile.name) === '.mp3') {
      yield { ...currentFile, path: filepath + currentFile.name };
    }
  }
}

const writeToJSON = (ignored: Set<string>, dataPath: string) => {
  //get file path for existing ignored list
  const filePath = path.join(dataPath, 'ignoredGenres.json');
  // get current ignore list from json file in user data
  const currIgnore = loadJsonFile(dataPath);
  // merge incoming and current ignore lists
  const newIgnore = currIgnore ? [...currIgnore, ...ignored] : [...ignored];

  //convert new ignore list to JSON format
  const newJSON = { ignore: newIgnore };
  let stringJS = JSON.stringify(newJSON);

  try {
    // overwrite ignore list with update values
    fs.writeFileSync(filePath, stringJS, { encoding: 'utf-8', flag: 'w' });
  } catch (e) {
    console.error('Failed to save file:', e);
  }
};

//TODO: folders,genreMap datatypes
async function saveGenres(
  folders: any[],
  genreMap: Map<number, any>,
  ignored: Set<string>,
  userDataPath: string
) {
  for (const folder of folders) {
    const albumID = generateHash(folder.album);
    const genreMapEntry = genreMap.get(albumID);
    if (genreMapEntry !== undefined) {
      if (genreMapEntry.size > 0) {
        const albumGenres = Array.from(genreMapEntry).join(', ');
        for await (const file of getFiles(`${folder.path}${folder.album}/`)) {
          if (EXIT_FLAG) {
            break;
          } else {
            if (file.name !== 'cover.jpg') {
              const blob = await openAsBlob(file.path);
              const arrayBuffer = await blob.arrayBuffer();
              const mp3tag = new MP3Tag(arrayBuffer);
              mp3tag.read();
              mp3tag.tags.genre = albumGenres;
              mp3tag.save();
              fs.writeFileSync(file.path, mp3tag.buffer as Buffer);
            }
          }
        }
      }
    }
  }

  if (ignored.size > 0) {
    writeToJSON(ignored, userDataPath);
  }

  return 'DONE';
}

function setQuit(value: boolean) {
  EXIT_FLAG = value;
}

const main = () => {
  if (workerData) {
    const { folders, genres, ignored, userDataPath } = workerData;
    saveGenres(folders, genres, ignored, userDataPath).then(() => {
      parentPort!!.postMessage({ message: 'done :)' });
    });
  }
};

main();

export { run, setQuit };

//TODO: deal with folders insde album (ie: disc 1 disc 2)
// if (file.isDirectory()) {
//   if (index++ === count) {
//     console.log('quitting at ', count);
//     break;
//   }
//   parseFolderName(file.name);
//   const artist = currentArist.replaceAll(' ', '+');
//   const album = currentAlbum.replaceAll(' ', '+');
//   const link = 'https://www.last.fm/music/' + artist + '/' + album;
//   currentHash = artist + '' + album;
//   const success = await getGenres(link).then((result) => {
//     return result;
//   });
//   if (success) {
//     if (currentGenres === '') {
//       console.log('Updating', file.name, 'genre to previously saved genre');

//       //     saveFile(filepath + '' + file.name);

//       mainWindow.send('recv-album', { album: file.name, genres: savedGenres.get(currentHash) });
//     } else {
//       console.log('Updating', file.name, 'genres to', currentGenres);
//       mainWindow.send('recv-album', { album: file.name, genres: currentGenres });
//       mainWindow.send('folder', 'test');
//     }

//     yield* getFiles(`${filepath}${file.name}/`);
//     console.log('\n');
//   }
// } else

// if (path.extname(file.name) === '.mp3') {
//   yield { ...file, path: filepath + file.name };
// }

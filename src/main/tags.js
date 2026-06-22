import { openAsBlob } from 'node:fs';
import MP3Tag from 'mp3tag.js';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { workerData, parentPort } from 'worker_threads';

let read = 0;
let currentAlbum = '';
let currentArist = '';
let currentGenres = '';
let currentHash = '';

let mainWindow;

let QUIT = false;

const savedGenres = new Map();
const genreSeparator = ', ';
const ignoredGenres = new Set([
  'screamo',
  'daethmetal',
  'yes',
  'all',
  'cd',
  'owned',
  'unitedstates',
  'oi',
  'dutch',
  'british',
  'london',
  'irish',
  'english',
  'finnish',
  'japanese',
  'australian',
  'german',
  'germany',
  'stuttgart',
  'femalevocalists',
  'french',
  'france',
  'femaleguitarists',
  'boston',
  'canadian',
  'lithuania',
  'lithuanian',
  'uk',
  'scottish',
  'bostonhardcore',
  'spotify',
  'texas',
  'american',
  'finland',
  'norwegian',
  'england',
  'russian',
  'russianalternative',
  'italy',
  'italian',
  'linkinpark',
  'viewingorganswithhaggleandscrog',
  'realscreamo',
  'usa',
  'sweden',
  'straightedge',
  'swedish',
  'needtorate',
  'idol',
  'femalevocalist',
  'heavy',
  'kawaiimetal',
  'indiepop',
  'drumless',
  'goodcharlotte',
  'newrelease',
  'rezension',
  'drumless',
  'crossover',
  'goodleftundone',
  'australia'
]);

const count = 9999;
let index = 0;

function PascalCase(string) {
  const newString = string.replace(/(\w)(\w*)/g, function (g0, g1, g2) {
    return g1.toUpperCase() + g2.toLowerCase();
  });
  return newString;
}

async function loadWebpage(link) {
  let genres = [];
  const tags = await cheerio.fromURL(link).then(($) => {
    //   console.log('loading', link);
    const $data = $('.tags-list:first').find('li');

    let $curr = $data.first();
    for (let i = 0; i < $data.length; i++) {
      let genre = $curr.text();
      var hasNumber = /\d/;

      if (!hasNumber.test(genre) && !ignoredGenres.has(genre.replaceAll(' ', ''))) {
        genres.push(PascalCase(genre));
      }
      $curr = $curr.next();
    }
    return genres;
  });
  return tags;
}

//TODO: if more than one hyphen exists, save all version of artist - artist
//eg. Dinosaur Pile-Up - album
function parseFolderName(folder) {
  let artist = '';

  let c = folder.slice(0, 1);
  do {
    artist += c;
    folder = folder.slice(1);
    c = folder.slice(0, 1);
  } while (c !== '-');

  currentArist = artist.trim();
  currentAlbum = folder.slice(1).trim();
}

async function getGenres(link) {
  let result;
  let pass = false;
  let retryAttempts = 0;

  while (true) {
    try {
      console.log('link:', link);
      await loadWebpage(link, {
        lowerCaseTags: true,
        lowerCaseAttributeNames: true
      }).then((data) => {
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
      console.log('input:', e.input);
      console.log('FAILED');
      console.log('retrying...');
      const newLink = e.input;
      if (newLink !== undefined) {
        link = 'https://www.last.fm' + e.input;
      } else {
        break;
      }
    }

    if (pass || retryAttempts > 1) {
      //    console.log('done');
      break;
    }
  }

  return result;
}

async function getDefaultGenres(filepath) {
  const e = await fs.promises.readdir(filepath, { withFileTypes: true });

  for (const file of e) {
    if (path.extname(file.name) === '.mp3') {
      const blob = await openAsBlob(filepath + file.name);
      const arrayBuffer = await blob.arrayBuffer();
      const mp3tag = new MP3Tag(arrayBuffer);
      mp3tag.read();
      savedGenres.set(currentHash, mp3tag.tags.v2.TCON);
      break;
    }
  }
}

async function run(window, filePath) {
  QUIT = false;
  mainWindow = window;
  console.log('run');

  // for await (const file of getFiles(filePath)) {
  //   if (QUIT) {
  //     console.log('quitting');
  //     break;
  //   } else {
  //     if (file.name !== 'cover.jpg') {
  //       console.log('file.path', file.path);
  //       const blob = await openAsBlob(file.path);
  //       console.log('blob', blob);
  //       const arrayBuffer = await blob.arrayBuffer();
  //       const mp3tag = new MP3Tag(arrayBuffer);
  //       mp3tag.read();
  //       console.log('mp3tag', mp3tag);
  //       // if (!savedGenres.get(currentHash)) {
  //       //   console.log('setting ' + currentHash + ' map entry to ' + mp3tag.tags.v2.TCON);
  //       //   savedGenres.set(currentHash, mp3tag.tags.v2.TCON);
  //       // }
  //       // if (read === 1) {
  //       //   console.log(mp3tag.tags.v2.TCON);
  //       // } else {
  //       //   if (currentGenres.length > 0) {
  //       //     mp3tag.tags.genre = currentGenres;
  //       //     mp3tag.save();
  //       //     fs.writeFileSync(file.path, mp3tag.buffer);
  //       //   } else {
  //       //     mp3tag.tags.genre = savedGenres.get(currentHash);
  //       //     mp3tag.save();
  //       //     fs.writeFileSync(file.path, mp3tag.buffer);
  //       //   }
  //       // }
  //     }
  //   }
  // }

  try {
    return await getFolders(filePath);
  } catch (e) {
    console.log('e', e);
  }
}

const generateHash = (string) => {
  let hash = 0;
  for (const char of string) {
    hash = (hash << 5) - hash + char.charCodeAt(0);
    hash |= 0; // Constrain to 32bit integer
  }
  return hash;
};

async function getFolders(filepath) {
  const e = await fs.promises.readdir(filepath, { withFileTypes: true });
  // console.log('directory', e);
  const folders = e.filter((item) => !/(^|\/)\.[^\/\.]/g.test(item.name));
  //const folderGenres = [];
  const numFolders = folders.length;

  const folderPaths = [];
  // console.log('entries', folders);

  for (let i = 0; i < numFolders; i++) {
    const currFolder = folders[i];
    folderPaths.push({ path: filepath, album: currFolder.name });
    //TODO: deal with folders insde album (ie: disc 1 disc 2)

    if (index++ === count) {
      console.log('quitting at ', count);
      break;
    }
    parseFolderName(currFolder.name);
    const artist = currentArist.replaceAll(' ', '+');
    const album = currentAlbum.replaceAll(' ', '+');
    const link = 'https://www.last.fm/music/' + artist + '/' + album;
    //  console.log('currFolder.name ', currFolder.name);
    currentHash = generateHash(currFolder.name);
    const success = await getGenres(link).then((result) => {
      //  console.log('result', result);
      return result;
    });
    if (success) {
      await getDefaultGenres(`${filepath}${currFolder.name}/`);
      if (currentGenres === '') {
        console.log('Updating', currFolder.name, 'genre to previously saved genre');

        console.log('savedGenres', savedGenres.get(currentHash));
        //   folderGenres.push({ album: currFolder.name, genres: savedGenres.get(currentHash) });
        mainWindow.send('recv-album', {
          album: currFolder.name,
          genres: savedGenres.get(currentHash)
        });
      } else {
        console.log('Updating', currFolder.name, 'genres to', currentGenres);
        mainWindow.send('recv-album', { album: currFolder.name, genres: currentGenres });

        //  folderGenres.push({ album: currFolder.name, genres: currentGenres });
      }

      console.log('\n');
    }

    // else if (path.extname(file.name) === '.mp3') {
    //   yield { ...file, path: filepath + file.name };
    // }
  }

  return folderPaths;

  // for (let i = 0; i < length; i++) {
  //   const file = entries[i];

  //   console.log('file', file);
  //   //TODO: deal with folders insde album (ie: disc 1 disc 2)
  //   if (file.isDirectory()) {
  //     if (index++ === count) {
  //       console.log('quitting at ', count);
  //       break;
  //     }
  //     parseFolderName(file.name);
  //     const artist = currentArist.replaceAll(' ', '+');
  //     const album = currentAlbum.replaceAll(' ', '+');
  //     const link = 'https://www.last.fm/music/' + artist + '/' + album;
  //     currentHash = artist + '' + album;
  //     const success = await getGenres(link).then((result) => {
  //       return result;
  //     });
  //     if (success) {
  //       if (currentGenres === '') {
  //         console.log('Updating', file.name, 'genre to previously saved genre');

  //         //     saveFile(filepath + '' + file.name);

  //         mainWindow.send('recv-album', { album: file.name, genres: savedGenres.get(currentHash) });
  //       } else {
  //         console.log('Updating', file.name, 'genres to', currentGenres);
  //         mainWindow.send('recv-album', { album: file.name, genres: currentGenres });
  //         mainWindow.send('folder', 'test');
  //       }

  //       yield* getFiles(`${filepath}${file.name}/`);
  //       console.log('\n');
  //     }
  //   } else if (extraCheck) {
  //   }

  //   // else if (path.extname(file.name) === '.mp3') {
  //   //   yield { ...file, path: filepath + file.name };
  //   // }
  // }
}

async function* getFiles(filepath) {
  const e = await fs.promises.readdir(filepath, { withFileTypes: true });

  const entries = e.filter((item) => !/(^|\/)\.[^\/\.]/g.test(item.name));

  const length = entries.length;

  for (let i = 0; i < length; i++) {
    const file = entries[i];

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

    if (path.extname(file.name) === '.mp3') {
      yield { ...file, path: filepath + file.name };
    }
  }
}

async function saveGenres(folders, genreMap) {
  // console.log('genreMap', genreMap);
  for (const folder of folders) {
    //console.log('folder', folder);
    const albumID = generateHash(folder.album);
    // console.log('albumID', albumID);
    const genreMapEntry = genreMap.get(albumID);
    //console.log('genreMapEntry', genreMapEntry);

    if (genreMapEntry !== undefined) {
      //   console.log('size', genreMapEntry.size);
      if (genreMapEntry.size > 0) {
        const albumGenres = Array.from(genreMapEntry).join(', ');
        console.log(folder.album, 'genres', albumGenres);
        for await (const file of getFiles(`${folder.path}${folder.album}/`)) {
          if (QUIT) {
            console.log('quitting');
            break;
          } else {
            if (file.name !== 'cover.jpg') {
              const blob = await openAsBlob(file.path);
              const arrayBuffer = await blob.arrayBuffer();
              const mp3tag = new MP3Tag(arrayBuffer);
              mp3tag.read();
              mp3tag.tags.genre = albumGenres;
              mp3tag.save();
              fs.writeFileSync(file.path, mp3tag.buffer);
            }
          }
        }
      }
    }
  }
  return 'DONE';
}

function setQuit(value) {
  QUIT = value;
}

const main = () => {
  if (workerData) {
    const { folders, genres } = workerData;
    console.log('mainWindow', mainWindow);
    // console.log('folders', folders);
    // console.log('genres', genres);
    saveGenres(folders, genres).then((response) => {
      console.log('return');
      console.log('parentPort', parentPort);
      console.log('response', response);
      parentPort.postMessage('saved', { response });
    });
  }
};

main();

export { run, setQuit };

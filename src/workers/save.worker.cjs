// async function saveGenres(folders, genreMap) {
//   // console.log('genreMap', genreMap);
//   for (const folder of folders) {
//     // console.log('folder', folder);
//     const albumID = generateHash(folder.album);
//     // console.log('albumID', albumID);
//     const genreMapEntry = genreMap.get(albumID);
//     //console.log('genreMapEntry', genreMapEntry);

//     if (genreMapEntry !== undefined) {
//       //   console.log('size', genreMapEntry.size);
//       if (genreMapEntry.size > 0) {
//         const albumGenres = Array.from(genreMapEntry).join(', ');
//         console.log(folder.album, 'genres', albumGenres);
//         for await (const file of getFiles(`${folder.path}${folder.album}/`)) {
//           if (QUIT) {
//             console.log('quitting');
//             break;
//           } else {
//             if (file.name !== 'cover.jpg') {
//               const blob = await openAsBlob(file.path);
//               const arrayBuffer = await blob.arrayBuffer();
//               const mp3tag = new MP3Tag(arrayBuffer);
//               mp3tag.read();
//               mp3tag.tags.genre = albumGenres;
//               mp3tag.save();
//               fs.writeFileSync(file.path, mp3tag.buffer);
//             }
//           }
//         }
//       }
//     }
//   }

//   return 'DONE';
// }

// const main = () => {
//   const { testData } = workerData;
//   console.log('testData', testData);
//   const counter = saveGenres();
//   parentPort.postMessage({ counter });
// };

// main();

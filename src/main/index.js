import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import { run, setQuit } from './workers/tags';
import { dialog } from 'electron';
import { Worker } from 'node:worker_threads';
import path from 'path';

import { fileURLToPath } from 'node:url';

if (require('electron-squirrel-startup')) {
  app.quit();
}

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 744,
    minHeight: 335,
    minWidth: 450,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return mainWindow;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron');

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  const window = createWindow();
  const genreMap = new Map();
  const ignoredGenres = new Set();
  let folderPaths = [];
  let folderPath = '';
  let isDialogOpen = false;
  let selectDirectory = false;

  const updateGenreMap = (add, id, genre) => {
    const albumGenres = genreMap.get(id);
    if (add) {
      albumGenres.add(genre);
    } else {
      albumGenres.delete(genre);
    }
    genreMap.set(id, albumGenres);
  };

  // messages received from render thread

  // add/remove genre from ignore list
  ipcMain.on('ignore-genre', (_event, value) => {
    const genre = value.genre.replaceAll(' ', '').toLowerCase();
    if (value.ignore) {
      ignoredGenres.add(genre);
    } else {
      ignoredGenres.delete(genre);
    }
  });

  // add/remove genre from list of respective album
  ipcMain.on('keep-genre', (_event, value) => {
    updateGenreMap(value.keep, value.album, value.genre);
  });

  // one OS file browser to select folder for scan
  ipcMain.on('open-file-browser', () => {
    if (!isDialogOpen) {
      isDialogOpen = true;
      dialog
        .showOpenDialog({
          properties: selectDirectory ? ['openDirectory', 'multiSelections'] : ['multiSelections'],
          filters: [{ name: 'Music', extensions: ['mp3', 'wav', 'm4a', 'flac', '.aac'] }]
        })
        .then((response) => {
          isDialogOpen = false;
          console.log('folders length:', response.length);
          if (!response.canceled) {
            console.log('response:', response);
            folderPath = response.filePaths[0] + '\\';

            //TODO: check if folder is empty
            window.webContents.send('folder-select', folderPath);
          }
        });
    }
  });

  // end scan, or go back to main screen
  ipcMain.on('quit-scan', () => {
    setQuit(true);
  });

  // start file save with new genres
  ipcMain.on('save-genres', () => {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const workerPath = path.join(__dirname, './worker.js');

    // to avoid freezing ui, create worker object to handle saving genres on separate thread
    const worker = new Worker(workerPath, {
      workerData: {
        folders: folderPaths, // direct path from root to each album folder
        genres: genreMap, // albums and their respective genres
        ignored: ignoredGenres, // new genres to ignore
        userDataPath: app.getPath('userData') // root folder for user files
      }
    });

    worker.on('message', (result) => {
      console.log('Received from worker:', result);
      window.webContents.send('save-complete', 'save complete!');
    });
  });

  // begin scanning albums in selected folder
  ipcMain.on('start-scan', () => {
    if (folderPath !== '') {
      run(window.webContents, folderPath, app.getPath('userData')).then((response) => {
        window.webContents.send('scan-complete', 'scan complete!');
        folderPaths = response;
      });
    } else {
      console.log('no folder selected');
    }
  });

  // during scan, update genres stored for respective album
  ipcMain.on('update-genre', (_event, value) => {
    genreMap.set(value.album, value.genres);
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

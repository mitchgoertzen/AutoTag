import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import { run, setQuit } from './workers/tags';
import { dialog } from 'electron';
import { Worker } from 'node:worker_threads';
import path from 'path';

import { fileURLToPath } from 'node:url';

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
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
  let isDialogOpen = false;

  let folderPath = '';

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

  const updateGenreMap = (add, id, genre) => {
    const albumGenres = genreMap.get(id);
    if (add) {
      albumGenres.add(genre);
    } else {
      albumGenres.delete(genre);
    }
    genreMap.set(id, albumGenres);
  };

  ipcMain.on('start', () => {
    if (folderPath !== '') {
      run(window.webContents, folderPath, app.getPath('userData')).then((response) => {
        window.webContents.send('scan-complete', 'scan complete!');
        folderPaths = response;
      });
    } else {
      console.log('no folder selected');
    }
  });

  ipcMain.on('quit', () => {
    setQuit(true);
  });

  ipcMain.on('update-genre', (_event, value) => {
    genreMap.set(value.album, value.genres);
  });

  ipcMain.on('save', () => {
    console.log('\nSAVE\n');

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const workerPath = path.join(__dirname, './worker.js');

    const worker = new Worker(workerPath, {
      workerData: {
        folders: folderPaths,
        genres: genreMap,
        ignored: ignoredGenres,
        userDataPath: app.getPath('userData')
      }
    });

    worker.on('message', (result) => {
      console.log('Received from worker:', result);
      window.webContents.send('save-complete', 'save complete!');
    });
  });

  ipcMain.on('genre', (_event, value) => {
    updateGenreMap(value.add, value.album, value.genre);
  });

  ipcMain.on('ignore', (_event, value) => {
    console.log('ignoring', value.genre, 'on main', value.ignore);
    const genre = value.genre.replaceAll(' ', '').toLowerCase();
    if (value.ignore) {
      ignoredGenres.add(genre);
    } else {
      ignoredGenres.delete(genre);
    }
  });

  ipcMain.on('open', () => {
    if (!isDialogOpen) {
      isDialogOpen = true;
      dialog.showOpenDialog({ properties: ['openDirectory'] }).then((response) => {
        isDialogOpen = false;
        console.log('folder returned:', response);
        if (!response.canceled) {
          console.log('start script at:', response.filePaths[0]);
          folderPath = response.filePaths[0] + '\\';
          window.webContents.send('folder-select', folderPath);
        }
      });
    }
  });

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

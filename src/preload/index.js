import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

// Custom APIs for renderer
const api = {};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('test', {
      onReceiveData: (callback) => {
        //   console.log('preload data');
        ipcRenderer.removeAllListeners('recv-album');
        ipcRenderer.once('recv-album', (_event, value) => callback(value));
      },
      onFolderSelected: (callback) => {
        //   console.log('preload folder');
        ipcRenderer.removeAllListeners('folder-select');
        ipcRenderer.once('folder-select', (_event, value) => callback(value));
      },
      onScanComplete: (callback) => {
        // console.log('preload scan');
        ipcRenderer.removeAllListeners('scan-complete');
        ipcRenderer.once('scan-complete', (_event, value) => callback(value));
      },
      onSaveComplete: (callback) => {
        // console.log('preload scan');
        ipcRenderer.removeAllListeners('save-complete');
        ipcRenderer.once('save-complete', (_event, value) => callback(value));
      }
    });
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = electronAPI;
  window.api = api;
}

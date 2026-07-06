import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

const api = {
  onReceiveAlbum: (callback) => {
    ipcRenderer.removeAllListeners('recv-album');
    ipcRenderer.once('recv-album', (_event, value) => callback(value));
  },
  onFolderSelected: (callback) => {
    ipcRenderer.removeAllListeners('folder-select');
    ipcRenderer.once('folder-select', (_event, value) => callback(value));
  },
  onScanComplete: (callback) => {
    ipcRenderer.removeAllListeners('scan-complete');
    ipcRenderer.once('scan-complete', (_event, value) => callback(value));
  },
  onSaveComplete: (callback) => {
    ipcRenderer.removeAllListeners('save-complete');
    ipcRenderer.on('save-complete', (_event, value) => callback(value));
  }
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = electronAPI;
  window.api = api;
}

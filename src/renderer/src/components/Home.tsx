import Footer from './Footer';
import { useCallback, useEffect, useState } from 'react';
import React from 'react';

//@ts-ignore
import icon from './../../../../resources/folder.png?asset';

declare global {
  interface Window {
    electron: any;
    api: any;
  }
}

function HomeScreen({ onStart }) {
  const [selectedFolder, setSelectedFolder] = useState(''); // root folder where albums are stored
  const [folderError, setFolderError] = useState(false); // error status of selected folder (ie. nothing selected)

  // send messages to main thread
  const ipcHandleFiles = () => window.electron.ipcRenderer.send('open-file-browser');
  const ipcHandleStart = () => window.electron.ipcRenderer.send('start-scan');

  const handleFolderSelect = useCallback((newFolder: string) => {
    setSelectedFolder(newFolder);
  }, []);

  // begin folder scan
  const handleStart = useCallback(() => {
    if (selectedFolder !== '') {
      onStart(); // execute parent callback
      ipcHandleStart(); // send message to main thread
    } else {
      setFolderError(true); // folder name is empty, show error
    }
  }, [selectedFolder]);

  // ** receive messages to main thread **

  // when new folder is selected on main thread, update ui
  window.api.onFolderSelected((input: string) => {
    setFolderError(false);
    handleFolderSelect(input);
  });

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div className="text">
          update your album genre <span className="react">tags</span>
        </div>
        <div className="actions">
          <div className="action">
            <a key={'startScan'} target="_blank" rel="noreferrer" onClick={handleStart}>
              scan files
            </a>
          </div>
        </div>
        <a className="folder" target="_blank" rel="noreferrer" onClick={ipcHandleFiles}>
          <div
            style={{
              height: '30px',
              alignSelf: 'center',
              justifyContent: 'center'
            }}
          >
            <img src={icon} className="icon" />
          </div>
          <div
            style={{
              alignSelf: 'center',
              justifyContent: 'center'
            }}
          >
            {selectedFolder !== '' ? selectedFolder : 'choose album folder'}
          </div>
        </a>
        {folderError && <div style={{ color: 'red', fontSize: 12 }}>no folder selected</div>}
        <Footer />
      </div>
    </>
  );
}

export default HomeScreen;

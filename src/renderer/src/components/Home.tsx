import Versions from './Versions';
import { useCallback, useEffect, useState } from 'react';
import React from 'react';

//@ts-ignore
import icon from './../../../../resources/folder.png?asset';

declare global {
  interface Window {
    electron: any;
    test: any;
  }
}

function Home({ onStart }) {
  const ipcHandleFiles = () => window.electron.ipcRenderer.send('open');
  const ipcHandleStart = () => window.electron.ipcRenderer.send('start');

  const [folder, setFolder] = useState('');
  const [folderError, setFolderError] = useState(false);

  const handleStart = () => {
    if (folder !== '') {
      onStart();
      ipcHandleStart();
    } else {
      setFolderError(true);
    }
  };

  const handleFolderSelect = useCallback((newFolder) => {
    setFolder(newFolder);
  }, []);

  window.test.onFolderSelected((input: string) => {
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
        <a className="files" target="_blank" rel="noreferrer" onClick={ipcHandleFiles}>
          <div style={{ alignSelf: 'center', justifyContent: 'center' }}>
            <img src={icon} className="icon" />
          </div>
          <div>{folder !== '' ? folder : 'choose album folder'}</div>
        </a>
        {folderError && <div style={{ color: 'red', fontSize: 12 }}>no folder selected</div>}
        <Versions />
      </div>
    </>
  );
}

export default Home;

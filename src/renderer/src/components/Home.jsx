import Versions from './Versions';
import icon from '../../../../resources/folder.png?asset';
import { useCallback, useEffect, useState } from 'react';

function Home({ onStart }) {
  const ipcHandleFiles = () => window.electron.ipcRenderer.send('open');
  const ipcHandleStart = () => window.electron.ipcRenderer.send('start');

  const [folder, setFolder] = useState('');

  const handleStart = () => {
    console.log('button press');
    onStart();
    ipcHandleStart();
  };

  const handleFolderSelect = useCallback((newFolder) => {
    setFolder(newFolder);
  }, []);

  window.test.onFolderSelected((input) => {
    console.log('newFolder', input);
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
          <img src={icon} className="icon" />
          <div>{folder !== '' ? folder : 'choose album folder'}</div>
        </a>
        <Versions></Versions>
      </div>
    </>
  );
}

export default Home;

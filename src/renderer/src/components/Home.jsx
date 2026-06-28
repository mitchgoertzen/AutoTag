import Versions from './Versions';
import icon from '../../../../resources/folder.png?asset';
import { useCallback, useEffect, useState } from 'react';

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

  window.test.onFolderSelected((input) => {
    console.log('newFolder', input);
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
          <img src={icon} className="icon" />
          <div>{folder !== '' ? folder : 'choose album folder'}</div>
        </a>
        {folderError && <div style={{ color: 'red', fontSize: 12 }}>no folder selected</div>}
        <Versions></Versions>
      </div>
    </>
  );
}

export default Home;

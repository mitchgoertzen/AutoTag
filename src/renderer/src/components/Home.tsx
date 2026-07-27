import Footer from './Footer';
import { useCallback, useEffect, useState } from 'react';
import React from 'react';
import Switch from 'react-switch';

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
  const [selectDirectory, setSelectDirectory] = useState(false); // error status of selected folder (ie. nothing selected)

  // send messages to main thread
  const ipcHandleFiles = () => window.electron.ipcRenderer.send('open-file-browser');
  const ipcHandleStart = () => window.electron.ipcRenderer.send('start-scan');

  const handleFolderSelect = useCallback((newFolder: string) => {
    setSelectedFolder(newFolder);
  }, []);

  // begin folder scan
  const handleStart = useCallback(() => {
    if (selectedFolder !== '') {
      console.log('selected folder:', selectedFolder);
      // onStart(); // execute parent callback
      // ipcHandleStart(); // send message to main thread
    } else {
      setFolderError(true); // folder name is empty, show error
    }
  }, [selectedFolder]);

  const handleChange = (checked) => {
    setSelectDirectory(checked);
  };

  // ** receive messages from main thread **

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
          update your album <span className="react">genres</span>
        </div>
        <div className="actions">
          <div className="action">
            <a key={'startScan'} target="_blank" rel="noreferrer" onClick={handleStart}>
              start scan
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
            {selectedFolder !== '' ? selectedFolder : 'choose album folders'}
          </div>
        </a>

        {folderError && <div style={{ color: 'red', fontSize: 12 }}>no folder selected</div>}

        {/* <label>
          <span>select files</span>
          <Switch
            onChange={handleChange}
            checked={selectDirectory}
            onColor="#86d3ff"
            onHandleColor="#2693e6"
            handleDiameter={30}
            uncheckedIcon={false}
            checkedIcon={false}
            boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
            activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
            height={20}
            width={48}
            className="react-switch"
          />
          <span>select folders</span>
        </label> */}

        <Footer />
      </div>
    </>
  );
}

export default HomeScreen;

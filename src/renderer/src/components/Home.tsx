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
  const [selectedFolders, setSelectedFolders] = useState([]); // root folder where albums are stored
  const [folderError, setFolderError] = useState(false); // error status of selected folder (ie. nothing selected)
  const [selectDirectory, setSelectDirectory] = useState(false); // error status of selected folder (ie. nothing selected)
  const [showSelectedFolders, setShowSelectedFolders] = useState(false); // error status of selected folder (ie. nothing selected)

  // send messages to main thread
  const ipcHandleFiles = () => window.electron.ipcRenderer.send('open-file-browser');
  const ipcHandleStart = () => window.electron.ipcRenderer.send('start-scan');

  const handleFolderSelect = useCallback((newFolder: string[]) => {
    setSelectedFolders(newFolder);
  }, []);

  // begin folder scan
  const handleStart = useCallback(() => {
    if (selectedFolders.length > 0) {
      console.log('selected folders:', selectedFolders);
      onStart(); // execute parent callback
      ipcHandleStart(); // send message to main thread
    } else {
      setFolderError(true); // folder name is empty, show error
    }
  }, [selectedFolders]);

  const handleChange = (checked) => {
    setSelectDirectory(checked);
  };

  const toggleShowFolders = (value) => {
    setShowSelectedFolders(value);
  };

  // ** receive messages from main thread **

  // when new folder is selected on main thread, update ui
  window.api.onFolderSelected((input: string[]) => {
    setFolderError(false);
    handleFolderSelect(input);
  });

  const renderSelectedFolders = useCallback(() => {
    console.log('selectedFolders', selectedFolders.length);
    return selectedFolders.map((folder) => (
      <div key={folder} style={{ fontSize: '14px' }}>
        {folder}
      </div>
    ));
  }, [selectedFolders]);

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          justifyContent: 'space-around',
          alignContent: 'center'
        }}
      >
        <div
          style={{
            flex: 0.5,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'end',
            alignItems: 'center'
          }}
        >
          <div className="text">
            update your album <span className="react">genres</span>
          </div>
          <div className="actions">
            <div className="action">
              <a
                key={'startScan'}
                target="_blank"
                rel="noreferrer"
                onClick={handleStart}
                style={{ fontSize: 16 }}
              >
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
              <div style={{ fontSize: 16 }}>
                {selectedFolders.length == 0
                  ? 'choose album folders'
                  : selectedFolders.length == 1
                    ? selectedFolders
                    : 'multiple folders selected'}
              </div>
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
        </div>

        <div
          style={{
            flex: 0.4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: '300px'
          }}
        >
          {selectedFolders.length > 1 && (
            <a
              onClick={() => {
                toggleShowFolders(!showSelectedFolders);
              }}
              style={{
                fontSize: 12,
                color: '#00bb10',
                fontWeight: 500,
                marginTop: '10px',
                justifySelf: 'center',
                display: 'flex'
              }}
            >
              {showSelectedFolders ? 'hide folders' : 'show folders'}
            </a>
          )}

          {showSelectedFolders && (
            <div
              style={{
                padding: '10px',
                marginTop: '5px',
                height: '20vh',
                width: '45vw',
                minWidth: '400px',
                backgroundColor: 'black',
                border: 'solid 0.5px #008612',
                overflow: 'auto'
              }}
            >
              {renderSelectedFolders()}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flex: 0.1, justifyContent: 'flex-end' }}>
          <Footer />
        </div>
      </div>
    </>
  );
}

export default HomeScreen;

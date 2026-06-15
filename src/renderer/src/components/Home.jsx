import Versions from './Versions';

function Home({ onStart }) {
  const ipcHandleFiles = () => window.electron.ipcRenderer.send('open');
  const ipcHandleStart = () => window.electron.ipcRenderer.send('start');

  const handleStart = () => {
    console.log('button press');
    onStart();
    ipcHandleStart();
  };

  return (
    <>
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

      <Versions></Versions>
      <a style={{ width: '100%' }} target="_blank" rel="noreferrer" onClick={ipcHandleFiles}>
        <div className="files">choose album folder</div>
      </a>
    </>
  );
}

export default Home;

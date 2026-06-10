import Versions from './Versions'

function Home({ onStart }) {
  const ipcHandle = () => window.electron.ipcRenderer.send('open')

  const handlePress = () => {
    onStart()
  }

  return (
    <>
      <div className="text">
        Update your album <span className="react">genres</span>
      </div>
      <div className="actions">
        <div className="action">
          <a key={'startScan'} target="_blank" rel="noreferrer" onClick={handlePress}>
            Scan Files
          </a>
        </div>
      </div>

      <Versions></Versions>
      <div className="files">
        <a target="_blank" rel="noreferrer" onClick={ipcHandle}>
          choose album folder
        </a>
      </div>
    </>
  )
}

export default Home

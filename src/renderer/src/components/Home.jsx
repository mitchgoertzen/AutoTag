// eslint-disable-next-line react/prop-types
function Home({ onStart }) {
  const ipcHandle = () => window.electron.ipcRenderer.send('ping')

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

      <div className="files">file explorer here</div>
    </>
  )
}

export default Home

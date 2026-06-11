import React from 'react'

function Running({ onEnd }) {
  const handlePress = () => {
    onEnd()
  }

  return (
    <div className="scan">
      <div className="text">
        scanning...
        <div className="action">
          <a key={'endScan'} target="_blank" rel="noreferrer" onClick={handlePress}>
            Quit
          </a>
        </div>
      </div>
    </div>
  )
}

export default Running

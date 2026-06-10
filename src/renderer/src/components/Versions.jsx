import { useState } from 'react'

function Versions() {
  const [versions] = useState(window.electron.process.versions)

  return (
    <ul className="versions">
      <li>
        <a className="info-footer" target="_blank" rel="noreferrer" href="https://www.last.fm/">
          tags generated from last.fm
        </a>
      </li>
      <li>
        <a
          className="info-footer"
          target="_blank"
          rel="noreferrer"
          href="https://mgoertzen.my.canva.site/"
        >
          mitch goertzen 2026
        </a>
      </li>
    </ul>
  )
}

export default Versions

import { useEffect, useState, useCallback, FlatList, Text } from 'react';
import GenreWidget from '../widgets/genreWidget';

function Running({ onEnd }) {
  const [scanComplete, setScanComplete] = useState(false);

  const [data, setData] = useState([]);

  const [genreMap, setGenreMap] = useState(new Map());

  const generateHash = (string) => {
    let hash = 0;
    for (const char of string) {
      hash = (hash << 5) - hash + char.charCodeAt(0);
      hash |= 0; // Constrain to 32bit integer
    }
    return hash;
  };

  function ltrim(str) {
    if (!str) return str;
    return str.replace(/^\s+/g, '');
  }

  function rtrim(str) {
    if (!str) return str;
    return str.replace(/\s+$/g, '');
  }

  const ipcHandleQuit = () => window.electron.ipcRenderer.send('quit');
  const ipcHandleSave = () => window.electron.ipcRenderer.send('save');

  const ipcHandleGenrePress = (a, g, r) =>
    window.electron.ipcRenderer.send('genre', { album: a, genre: g, remove: r });

  const handleSave = () => {
    ipcHandleSave();
    onEnd();
  };
  const handleQuit = () => {
    ipcHandleQuit();
    onEnd();
  };

  const updateGenreMap = useCallback(
    (add, id, genre) => {
      const currentMap = new Map(genreMap);
      const albumGenres = currentMap.get(id);

      console.log('id:', id);
      console.log('before:', albumGenres);
      if (add) {
        console.log('add');
        albumGenres.add(genre);
      } else {
        console.log('remove');
        albumGenres.delete(genre);
      }
      currentMap.set(id, albumGenres);
      console.log(genre, 'in', id);
      console.log('after:', albumGenres);
      setGenreMap(currentMap);
    },
    [genreMap]
  );

  const updateData = useCallback(
    (newData) => {
      console.log('updateData');
      let genreArray = [];
      const currentData = [...data];
      if (newData.genres) {
        genreArray = newData.genres.split(',');
      }

      const formattedArray = genreArray.map((item) => ltrim(item));
      const id = generateHash(newData.album);
      currentData.push({ id: id, album: newData.album, genres: formattedArray });
      const currentMap = new Map(genreMap);
      currentMap.set(id, new Set(formattedArray));
      setGenreMap(currentMap);
      setData(currentData);
    },
    [data, genreMap, setGenreMap, setData]
  );

  window.test.onReceiveData((input) => {
    console.log('input to ui', input);
    updateData(input);
  });

  window.test.onScanComplete((input) => {
    console.log('scan complete');
    setScanComplete(true);
  });

  const renderGenres = useCallback(
    (genres, albumID) => {
      return genres.map((g) => (
        <GenreWidget
          key={g}
          title={ltrim(rtrim(g))}
          onPress={(a) => {
            updateGenreMap(a, albumID, g);
            // ipcHandleGenrePress(albumID, ltrim(rtrim(g)), a);
          }}
        />
      ));
    },
    [updateGenreMap]
  );

  const renderList = useCallback(() => {
    return data.map(({ id, album, genres }) => (
      // 3. Always assign a unique "key" prop to the outermost list element

      <div
        key={id}
        style={{
          display: 'flex',
          flexDirection: 'row',
          paddingBottom: '5px',
          paddingTop: '5px',
          alignItems: 'center'
        }}
      >
        <div className="textTwo" key={album}>
          <div style={{ width: 250 }}>{album}</div>
        </div>
        <div
          style={{
            display: 'table',
            alignContent: 'flex-start',
            borderSpacing: '5px'
          }}
        >
          {renderGenres(genres, id)}
        </div>
      </div>
    ));
  }, [data, renderGenres]);

  return (
    <div className="scan">
      <div className="text">{scanComplete ? 'scan complete' : 'scanning...'}</div>

      <div className="box">
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', flex: 1 }}>
          <div
            style={{
              fontSize: '10px',
              textAlign: 'center',
              marginTop: '5px'
            }}
          >
            {scanComplete && 'select genres to keep, or right click to permanently ignore'}
          </div>
          <div className="list">{renderList()}</div>
        </div>
      </div>
      <div className="action">
        <a key={'saveGenres'} target="_blank" rel="noreferrer" onClick={handleSave}>
          Save
        </a>
      </div>
      <div className="action">
        <a key={'endScan'} target="_blank" rel="noreferrer" onClick={handleQuit}>
          Quit
        </a>
      </div>
    </div>
  );
}

export default Running;

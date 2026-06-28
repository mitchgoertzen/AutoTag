import { useEffect, useState, useCallback } from 'react';
import GenreWidget from '../widgets/genreWidget';
import generateHash from '../../../util/util';
import React from 'react';

function Running({ onEnd }) {
  const [scanComplete, setScanComplete] = useState(false);

  const [saving, setSaving] = useState(false);
  const [data, setData] = useState([]);

  // const [genreMap, setGenreMap] = useState(new Map());

  function ltrim(str) {
    if (!str) return str;
    return str.replace(/^\s+/g, '');
  }

  function rtrim(str) {
    if (!str) return str;
    return str.replace(/\s+$/g, '');
  }

  const ipcHandleUpdateGenres = (data) => window.electron.ipcRenderer.send('update-genre', data);
  const ipcHandleQuit = () => window.electron.ipcRenderer.send('quit');
  const ipcHandleSave = () => window.electron.ipcRenderer.send('save');

  const ipcHandleGenrePress = (a, g, r) =>
    window.electron.ipcRenderer.send('genre', { album: a, genre: g, add: r });

  const ipcHandleIgnoreGenre = (g, i) =>
    window.electron.ipcRenderer.send('ignore', { genre: g, ignore: i });

  const handleSave = useCallback(() => {
    console.log('save');
    //TODO: update genre lists with removed/ignored
    setSaving(true);
    // console.log('map', genreMap);
    ipcHandleSave();
  }, []);

  const handleQuit = () => {
    ipcHandleQuit();
    onEnd();
  };

  const updateData = useCallback(
    (newData) => {
      let genreArray = [];
      const currentData = [...data];
      if (newData.genres) {
        genreArray = newData.genres.split(',');
      }

      // console.log('updateData genreArray', genreArray);
      const formattedArray = genreArray.map((item) => (item[0] === ' ' ? ltrim(item) : item));
      //  console.log('newData.album', newData.album);
      const id = generateHash(newData.album);
      currentData.push({ id: id, album: newData.album, genres: formattedArray });
      //   const currentMap = new Map(existingGenres);
      ipcHandleUpdateGenres({ album: id, genres: new Set(formattedArray) });
      // currentMap.set(id);
      // setGenreMap(currentMap);
      // console.log(currentMap);
      setData(currentData);
    },
    [data, setData]
  );

  useEffect(() => {
    window.test.onSaveComplete((input: any) => {
      console.log('ui', input);
      setSaving(false);
    });
  }, []);

  useEffect(() => {
    window.test.onReceiveData((input: any) => {
      updateData(input);
    });
  }, [updateData]);

  window.test.onScanComplete(() => {
    console.log('scan complete');
    setScanComplete(true);
  });

  const renderGenres = useCallback((genres, albumID) => {
    return genres.map((g) => (
      <div key={g}>
        <GenreWidget
          title={ltrim(rtrim(g))}
          onIgnore={(genre, ignore) => {
            console.log('ignore', genre, 'is', ignore);
            ipcHandleIgnoreGenre(genre, ignore);
          }}
          onPress={(a) => {
            ipcHandleGenrePress(albumID, ltrim(rtrim(g)), a);
          }}
        />
      </div>
    ));
  }, []);

  const renderList = useCallback(() => {
    return data.map(({ id, album, genres }) => (
      // 3. Always assign a unique "key" prop to the outermost list element

      <div key={id} className="listRow" style={{}}>
        <div
          className="textTwo"
          key={album}
          style={{
            alignContent: 'center',
            display: 'table-cell',
            width: '250px',
            paddingRight: '10px',
            minWidth: '250px'
          }}
        >
          {album}
        </div>

        <div
          style={{
            display: 'table-cell',
            alignContent: 'center'
          }}
        >
          <div
            className="genreRow"
            style={{
              display: 'flex'
            }}
          >
            {renderGenres(genres, id)}
          </div>
        </div>
      </div>
    ));
  }, [data, renderGenres]);

  //TODO: add rescan button after first scan?
  return (
    <div className="scan">
      <div className="text">{scanComplete ? 'scan complete' : 'scanning...'}</div>

      <div className="container">
        {saving && (
          <div className="item2">
            <div className="loader" />
            <div>saving </div>
          </div>
        )}
        <div className="box">
          <div
            style={{
              fontSize: '10px',
              textAlign: 'center',
              marginTop: '1em',
              width: '100%'
            }}
          >
            <div className="centre">
              {scanComplete && 'select genres to keep, or right click to permanently ignore'}
            </div>
            <div className="list" style={{ display: 'table' }}>
              {renderList()}
            </div>
          </div>
        </div>
      </div>

      {/* <div>files saved!</div> */}

      <div className="action">
        <button type="button" disabled={saving || !scanComplete} onClick={handleSave}>
          Save
        </button>
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

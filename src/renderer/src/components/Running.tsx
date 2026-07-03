import { useEffect, useState, useCallback } from 'react';
import GenreWidget from '../widgets/genreWidget';
import generateHash from '../../../util/util';
import React from 'react';

declare global {
  interface Window {
    electron: any;
  }
}

function Running({ onEnd }) {
  const [scanComplete, setScanComplete] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const [data, setData] = useState<any>([]);

  function ltrim(str: string) {
    if (!str) return str;
    return str.replace(/^\s+/g, '');
  }

  function rtrim(str: string) {
    if (!str) return str;
    return str.replace(/\s+$/g, '');
  }

  const ipcHandleUpdateGenres = (data: any) =>
    window.electron.ipcRenderer.send('update-genre', data);
  const ipcHandleQuit = () => window.electron.ipcRenderer.send('quit');
  const ipcHandleSave = () => window.electron.ipcRenderer.send('save');

  const ipcHandleGenrePress = (a: any, g: string, r: boolean) =>
    window.electron.ipcRenderer.send('genre', { album: a, genre: g, add: r });

  const ipcHandleIgnoreGenre = (g: string, i: boolean) =>
    window.electron.ipcRenderer.send('ignore', { genre: g, ignore: i });

  const handleSave = useCallback(() => {
    setSaving(true);
    ipcHandleSave();
  }, []);

  const handleQuit = () => {
    ipcHandleQuit();
    onEnd();
  };

  const updateData = useCallback(
    (newData: any) => {
      let genreArray = [];
      const currentData: any[] = [...data];
      if (newData.genres) {
        genreArray = newData.genres.split(',');
      }

      const formattedArray = genreArray.map((item) => (item[0] === ' ' ? ltrim(item) : item));
      const id = generateHash(newData.album);
      currentData.push({ id: id, album: newData.album, genres: formattedArray });
      ipcHandleUpdateGenres({ album: id, genres: new Set(formattedArray) });
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

  useEffect(() => {
    window.test.onScanComplete(() => {
      console.log('scan complete');
      setScanComplete(true);
    });
  }, []);

  const renderGenres = useCallback((genres: string[], albumID) => {
    return genres.map((currGenre) => (
      <div key={currGenre}>
        <GenreWidget
          title={ltrim(rtrim(currGenre))}
          onIgnore={(genre, ignore) => {
            ipcHandleIgnoreGenre(genre, ignore);
          }}
          onPress={(add: boolean) => {
            ipcHandleGenrePress(albumID, ltrim(rtrim(currGenre)), add);
          }}
        />
      </div>
    ));
  }, []);

  const renderList = useCallback(() => {
    return data.map(({ id, album, genres }) => (
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
          Back
        </a>
      </div>
    </div>
  );
}

export default Running;

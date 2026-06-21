import { useEffect, useState, useCallback, FlatList, Text, useMemo } from 'react';
import GenreWidget from '../widgets/genreWidget';
import generateHash from '../../../util/util';

function Running({ onEnd }) {
  const [scanComplete, setScanComplete] = useState(false);

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

  const handleSave = useCallback(() => {
    console.log('save');
    // console.log('map', genreMap);
    ipcHandleSave();
  }, []);

  const handleQuit = () => {
    ipcHandleQuit();
    onEnd();
  };

  // const updateGenreMap = useCallback(
  //   (add, id, genre) => {
  //     console.log('genreMap', genreMap);
  //     const currentMap = new Map(genreMap);
  //     const albumGenres = currentMap.get(id);

  //     console.log('id:', id);
  //     console.log('before:', albumGenres);
  //     if (add) {
  //       console.log('add');
  //       albumGenres.add(genre);
  //     } else {
  //       console.log('remove');
  //       albumGenres.delete(genre);
  //     }
  //     currentMap.set(id, albumGenres);
  //     console.log(genre, 'in', id);
  //     console.log('after:', albumGenres);
  //     setGenreMap(currentMap);
  //     console.log(currentMap);
  //   },
  //   [genreMap]
  // );

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
    window.test.onReceiveData((input) => {
      updateData(input);
    });
  }, [updateData]);

  window.test.onScanComplete((input) => {
    console.log('scan complete');
    setScanComplete(true);
  });

  const renderGenres = useCallback((genres, albumID) => {
    return genres.map((g) => (
      <GenreWidget
        key={g}
        title={ltrim(rtrim(g))}
        onPress={(a) => {
          ipcHandleGenrePress(albumID, ltrim(rtrim(g)), a);
        }}
      />
    ));
  }, []);

  const renderList = useCallback(
    (map) => {
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
            {renderGenres(genres, id, map)}
          </div>
        </div>
      ));
    },
    [data, renderGenres]
  );

  // const renderListfuncton = useMemo(() => {
  //   return data.map(({ id, album, genres }) => (
  //     // 3. Always assign a unique "key" prop to the outermost list element

  //     <div
  //       key={id}
  //       style={{
  //         display: 'flex',
  //         flexDirection: 'row',
  //         paddingBottom: '5px',
  //         paddingTop: '5px',
  //         alignItems: 'center'
  //       }}
  //     >
  //       <div className="textTwo" key={album}>
  //         <div style={{ width: 250 }}>{album}</div>
  //       </div>
  //       <div
  //         style={{
  //           display: 'table',
  //           alignContent: 'flex-start',
  //           borderSpacing: '5px'
  //         }}
  //       >
  //         {renderGenres(genres, id, genreMap)}
  //       </div>
  //     </div>
  //   ));
  // }, [data, renderGenres, genreMap, updateGenreMap]);

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

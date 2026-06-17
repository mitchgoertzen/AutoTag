import { useEffect, useState, useCallback, FlatList, Text } from 'react';

function Running({ onEnd }) {
  const [data, setData] = useState([
    // 'band 1 - album',
    // 'band 2 - album',
    // 'band 3 - album',
    // 'band 4 - album',
    // 'band 5 - album',
    // 'band 6 - album',
    // 'band 7 - album',
    // 'band 8 - album',
    // 'band 9 - album',
    // 'band 10 - album',
    // 'band 11 - album',
    // 'band 12 - album'
  ]);

  const handlePress = () => {
    onEnd();
  };

  const updateData = useCallback(
    (newData) => {
      console.log('updateData');
      const currentData = [...data];
      currentData.push(newData);
      setData(currentData);
    },
    [data]
  );

  window.test.onReceiveData((input) => {
    console.log('input to ui', input);
    updateData(input);
  });

  const renderList = useCallback(() => {
    return data.map((item) => (
      // 3. Always assign a unique "key" prop to the outermost list element
      <div className="textTwo" key={item} style={{ width: '100%' }}>
        {item}
      </div>
    ));
  }, [data]);

  return (
    <div className="scan">
      <div className="text">scanning...</div>
      <div className="box">
        <div className="list">{renderList()}</div>
      </div>
      <div className="action">
        <a key={'endScan'} target="_blank" rel="noreferrer" onClick={handlePress}>
          Quit
        </a>
      </div>
    </div>
  );
}

export default Running;

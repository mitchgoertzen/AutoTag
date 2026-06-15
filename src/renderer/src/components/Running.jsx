import { useEffect, useState, useCallback, FlatList, Text } from 'react';

function Running({ onEnd }) {
  const [data, setData] = useState([]);

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
  // useEffect(() => {
  //   console.log('useEffect');
  //   // Set up the listener using the function defined in preload.js

  // }, []);

  return (
    <div className="scan">
      <div className="text">scanning...</div>
      <div className="box">{renderList()}</div>
      <div className="action">
        <a key={'endScan'} target="_blank" rel="noreferrer" onClick={handlePress}>
          Quit
        </a>
      </div>
    </div>
  );
}

export default Running;

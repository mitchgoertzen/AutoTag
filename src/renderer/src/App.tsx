import { useEffect, useState } from 'react';
import HomeScreen from './components/Home';
import AlbumsScreen from './components/Albums';
import { useCallback } from 'react';
import React from 'react';

function App() {
  const [currentScreen, setCurrentScreen] = useState('home');

  const renderScreen = useCallback(() => {
    let screen: any;
    screen =
      currentScreen === 'home' ? (
        <HomeScreen
          onStart={() => {
            setCurrentScreen('running');
          }}
        />
      ) : (
        <AlbumsScreen
          onEnd={() => {
            setCurrentScreen('home');
          }}
        />
      );

    return screen;
  }, [currentScreen]);

  return renderScreen();
}

export default App;

import { useState } from 'react'
import Home from './components/Home'
import Running from './components/Running'
import { useCallback } from 'react'

function App() {
  const [currentScreen, setCurrentScreen] = useState('home')

  const renderScreen = useCallback(() => {
    let screen
    screen =
      currentScreen === 'home' ? (
        <Home
          onStart={() => {
            setCurrentScreen('running')
          }}
        />
      ) : (
        <Running
          onEnd={() => {
            setCurrentScreen('home')
          }}
        />
      )

    return screen
  }, [currentScreen])

  return renderScreen()
}

export default App

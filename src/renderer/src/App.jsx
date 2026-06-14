import { useEffect, useState } from 'react'
import Home from './components/Home'
import Running from './components/Running'
import { useCallback } from 'react'

function App() {
  const [currentScreen, setCurrentScreen] = useState('home')

  useEffect(() => {
    // Set up the listener using the function defined in preload.js
    window.test.onReceiveData((data) => {
      console.log('ui data', data)
    })
  }, [])

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

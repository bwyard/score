import { useState }      from 'react'
import { SplashScreen }  from './components/SplashScreen.js'
import { LiveCode }      from './components/LiveCode/index.js'
import { Produce }       from './components/Produce/index.js'
import { DJSet }         from './components/DJSet/index.js'
import { JamSession }    from './components/JamSession/index.js'
import type { StudioMode, HardwareLevel } from '../main/ipc-types.js'

type AppState =
  | { screen: 'splash' }
  | { screen: 'mode'; mode: StudioMode; hardware: HardwareLevel }

/** Root app shell — routes between splash screen and active mode. */
export const App = () => {
  const [state, setState] = useState<AppState>({ screen: 'splash' })

  const goHome = () => { setState({ screen: 'splash' }) }

  if (state.screen === 'splash') {
    return (
      <SplashScreen
        onSelect={(mode, hardware) => {
          window.scoreBridge.send('mode:selected', { mode, hardware })
          setState({ screen: 'mode', mode, hardware })
        }}
      />
    )
  }

  const { mode, hardware } = state

  return (
    <>
      {mode === 'live-code'   && <LiveCode   hardware={hardware} onHome={goHome} />}
      {mode === 'produce'     && <Produce    hardware={hardware} onHome={goHome} />}
      {mode === 'dj-set'      && <DJSet      hardware={hardware} onHome={goHome} />}
      {mode === 'jam-session' && <JamSession hardware={hardware} onHome={goHome} />}
    </>
  )
}

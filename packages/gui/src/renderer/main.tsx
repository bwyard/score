import React        from 'react'
import { createRoot } from 'react-dom/client'
import { App }      from './App.js'

// Dev error boundary — surfaces render crashes that would otherwise leave a blank screen.
// Shows the error message + stack directly in the window so DevTools aren't needed to diagnose.
class DevErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    const { error } = this.state
    if (error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'monospace', color: '#ff6b6b', background: '#0d0d0f', height: '100vh' }}>
          <h2 style={{ color: '#ff6b6b', marginBottom: '1rem' }}>Renderer crash</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>{error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem', color: '#888', marginTop: '1rem' }}>{error.stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

const root = document.getElementById('root')
if (!root) throw new Error('root element not found')

createRoot(root).render(
  <React.StrictMode>
    <DevErrorBoundary>
      <App />
    </DevErrorBoundary>
  </React.StrictMode>,
)

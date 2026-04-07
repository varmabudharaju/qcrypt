import { StrictMode, Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('React crash:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ background: '#131318', color: '#ffb4ab', padding: 40, fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
          <h1 style={{ color: '#39ff14', marginBottom: 16 }}>QC-SENTRY // RUNTIME ERROR</h1>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#e4e1e9' }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 12, color: '#baccb0', fontSize: 11 }}>{this.state.error.stack}</pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 20, background: '#39ff14', color: '#053900', padding: '8px 20px', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
            RELOAD
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)

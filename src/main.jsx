import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

async function enableMocking() {
  if (import.meta.env.MODE !== 'development' || import.meta.env.VITE_USE_MOCKS === 'false') {
    return
  }
 
  const { worker } = await import('./mocks/browser')
  return worker.start()
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})

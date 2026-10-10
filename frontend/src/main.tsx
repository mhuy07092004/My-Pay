import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ScrollbarAutohide } from '../components/scrollbar/scrollbar_autohide.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { TimesheetProvider } from './context/TimesheetContext.tsx'
import './i18n'
import './index.css'
import App from './App.tsx'

async function enableMocking() {
  const { worker } = await import('../mock/browser')
  return worker.start({ onUnhandledRequest: 'bypass' })
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ScrollbarAutohide />
      <BrowserRouter>
        <AuthProvider>
          <TimesheetProvider>
            <App />
          </TimesheetProvider>
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>,
  )
})

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ScrollbarAutohide } from '../components/scrollbar/scrollbar_autohide.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { PayDataProvider } from './context/PayDataContext.tsx'
import { TimesheetProvider } from './context/TimesheetContext.tsx'
import './i18n'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ScrollbarAutohide />
    <BrowserRouter>
      <AuthProvider>
        <PayDataProvider>
          <TimesheetProvider>
            <App />
          </TimesheetProvider>
        </PayDataProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

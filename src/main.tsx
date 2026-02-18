import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app'
import { LanguageProvider } from './i18n/languageContext'
import { validateScriptURL } from './utils/scriptUrlValidation'

const ALLOWED_ORIGINS = new Set([window.location.origin])

if ('trustedTypes' in window) {
  ;(window.trustedTypes as TrustedTypePolicyFactory).createPolicy('default', {
    createScriptURL: (input: string) => validateScriptURL(input, ALLOWED_ORIGINS),
  })
}

const rootElement = document.querySelector('#root')
if (!rootElement) {
  throw new Error('Root element "#root" not found')
}

createRoot(rootElement, {
  onCaughtError: (error, errorInfo) => {
    console.error('Error caught by boundary:', error);
    if (errorInfo.componentStack) {
      console.error('Component stack:', errorInfo.componentStack);
    }
  },
  onUncaughtError: (error, errorInfo) => {
    console.error('Uncaught error:', error);
    if (errorInfo.componentStack) {
      console.error('Component stack:', errorInfo.componentStack);
    }
  },
}).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
)

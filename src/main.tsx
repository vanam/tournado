import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app'
import { LanguageProvider } from './i18n/languageContext'
import { validateScriptURL } from './utils/scriptUrlValidation'
import DOMPurify from 'dompurify' // needs esModuleInterop

const ALLOWED_ORIGINS = new Set([window.location.origin, 'https://www.googletagmanager.com'])

if ('trustedTypes' in window) {
  ;(window.trustedTypes as TrustedTypePolicyFactory).createPolicy('default', {
    createScriptURL: (input: string) => validateScriptURL(input, ALLOWED_ORIGINS),
    createHTML: (input: string) => DOMPurify.sanitize(input),
    createScript: () => { throw new Error('TrustedScript creation is not allowed') },
  })
}

if ('serviceWorker' in navigator) {
  void navigator.serviceWorker.register('/sw-api.js', { scope: '/' })
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

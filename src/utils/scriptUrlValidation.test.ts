import { describe, it, expect } from 'vitest'
import { validateScriptURL } from './scriptUrlValidation'

describe('validateScriptURL', () => {
  const allowedOrigins = new Set(['https://example.com'])

  describe('blocks malicious URLs', () => {
    it('blocks cross-origin URLs', () => {
      expect(() => validateScriptURL('https://evil.com/x.js', allowedOrigins)).toThrow(TypeError)
      expect(() => validateScriptURL('https://evil.com/x.js', allowedOrigins)).toThrow('Script URL not allowed')
    })

    it('blocks javascript: protocol', () => {
      expect(() => validateScriptURL('java' + 'script:alert(1)', allowedOrigins)).toThrow(TypeError)
    })

    it('blocks data: protocol', () => {
      expect(() => validateScriptURL('data:text/javascript,alert(1)', allowedOrigins)).toThrow(TypeError)
    })

    it('blocks vbscript: protocol', () => {
      expect(() => validateScriptURL('vbscript:msgbox(1)', allowedOrigins)).toThrow(TypeError)
    })

    it('blocks blob: URLs from different origin', () => {
      expect(() => validateScriptURL('blob:https://evil.com/uuid', allowedOrigins)).toThrow(TypeError)
    })
  })

  describe('allows same-origin URLs', () => {
    it('allows relative URLs', () => {
      expect(validateScriptURL('/assets/app.js', allowedOrigins)).toBe('/assets/app.js')
    })

    it('allows relative URLs with subdirectories', () => {
      expect(validateScriptURL('/worker.js', allowedOrigins)).toBe('/worker.js')
    })

    it('allows absolute same-origin URLs', () => {
      expect(validateScriptURL('https://example.com/assets/app.js', allowedOrigins)).toBe('https://example.com/assets/app.js')
    })

    it('allows same-origin URL with query string', () => {
      expect(validateScriptURL('/assets/app.js?v=1', allowedOrigins)).toBe('/assets/app.js?v=1')
    })

    it('allows same-origin URL with hash', () => {
      expect(validateScriptURL('/assets/app.js#section', allowedOrigins)).toBe('/assets/app.js#section')
    })
  })
})

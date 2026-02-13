export function validateScriptURL(input: string, allowedOrigins: Set<string>): string {
  try {
    const baseOrigin = [...allowedOrigins][0]
    const url = new URL(input, baseOrigin)
    if (allowedOrigins.has(url.origin)) {
      return input
    }
  } catch {
    // Invalid URL
  }
  throw new TypeError(`Script URL not allowed: ${input}`)
}

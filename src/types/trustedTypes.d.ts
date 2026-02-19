interface TrustedTypePolicyFactory {
  createPolicy(
    policyName: string,
    policyOptions: {
      createScriptURL?: (input: string) => string
      createHTML?: (input: string) => string
    }
  ): TrustedTypePolicy
}

interface TrustedTypePolicy {
  name: string
  createScriptURL(input: string): TrustedScriptURL
  createHTML(input: string): TrustedHTML
}

interface TrustedScriptURL {
  __brand__: 'TrustedScriptURL'
}

interface TrustedHTML {
  __brand__: 'TrustedHTML'
}

declare let trustedTypes: TrustedTypePolicyFactory

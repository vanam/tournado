interface TrustedTypePolicyFactory {
  createPolicy(
    policyName: string,
    policyOptions: {
      createScriptURL?: (input: string) => string
    }
  ): TrustedTypePolicy
}

interface TrustedTypePolicy {
  name: string
  createScriptURL(input: string): TrustedScriptURL
}

interface TrustedScriptURL {
  __brand__: 'TrustedScriptURL'
}

declare let trustedTypes: TrustedTypePolicyFactory

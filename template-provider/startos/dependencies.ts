import { sdk } from './sdk'
import { sv2TpConfFile } from './fileModels/sv2-tp.conf'

export const setDependencies = sdk.setupDependencies(async ({ effects }) => {
  // Read config to determine which Bitcoin service to depend on
  const conf = await sv2TpConfFile.read().const(effects)
  const chain = conf?.chain || 'main'
  const isTestnet4 = chain === 'testnet4'

  // Return the appropriate dependency based on network mode
  // Both are optional in manifest, so we only return the one we need
  if (isTestnet4) {
    return {
      'bitcoind-testnet4': {
        kind: 'running' as const,
        healthChecks: [],
        versionRange: '*',
      },
    }
  } else {
    return {
      bitcoind: {
        kind: 'running' as const,
        healthChecks: [],
        versionRange: '*',
      },
    }
  }
})

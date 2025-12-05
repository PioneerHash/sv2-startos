import { sdk } from './sdk'
import { configToml } from './fileModels/config.toml'

export const setDependencies = sdk.setupDependencies(
  async ({ effects }) => {
    // Read current pool configuration to determine dependencies
    let config
    try {
      config = await configToml.read().const(effects)
    } catch (e) {
      // No config yet, no dependencies
      return {}
    }

    if (!config || !config.template_provider_mode) {
      // No config yet, no dependencies
      return {}
    }

    // Return dependencies based on template provider mode
    switch (config.template_provider_mode) {
      case 'local-sv2-tp':
        return {
          'sv2-template-provider': {
            kind: 'running',
            versionRange: '>=0.4.0.0',
            healthChecks: [],
          },
        }

      case 'bitcoin-core-ipc': {
        // Determine which Bitcoin Core based on network
        const bitcoindServiceId =
          config.bitcoin_network === 'testnet4'
            ? 'bitcoind-testnet4'
            : 'bitcoind'

        return {
          [bitcoindServiceId]: {
            kind: 'running',
            versionRange: '>=30.0.0',
            healthChecks: [],
          },
        }
      }

      case 'remote-sv2-tp':
      default:
        // No dependencies for remote Template Provider
        return {}
    }
  },
)

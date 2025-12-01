import { sdk } from './sdk'
import { sv2TpConfFile } from './fileModels/sv2-tp.conf'

export const setDependencies = sdk.setupDependencies(async ({ effects }) => {
  // Read config to determine which Bitcoin Core service to bind to
  const conf = await sv2TpConfFile.read().const(effects)
  const testnet4Mode = conf?.testnet4Mode ?? false

  // Bind to the appropriate Bitcoin Core service based on testnet4Mode
  const bitcoinServiceId = testnet4Mode ? 'bitcoind-testnet4' : 'bitcoind'

  return {
    [bitcoinServiceId]: {
      volumes: {
        ipc: {
          type: 'pointer',
          volumeId: 'ipc',
          path: '/',
          readonly: true,
        },
      },
    },
  }
})

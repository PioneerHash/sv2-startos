import { sdk } from '../sdk'
import { sv2TpConfFile } from '../fileModels/sv2-tp.conf'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  // Testnet4 Mode Toggle
  testnet4Mode: Value.toggle({
    name: 'Testnet4 Mode',
    description:
      'Enable to connect to Bitcoin Core Testnet4 instead of mainnet. This determines which IPC socket to use.',
    default: false,
  }),

  // Network Chain
  chain: Value.select({
    name: 'Bitcoin Network',
    description: 'Bitcoin network chain to operate on',
    default: 'main',
    values: {
      main: 'Mainnet',
      test: 'Testnet',
      signet: 'Signet',
      regtest: 'Regtest',
    },
  }),

  // Template Update Interval
  sv2interval: Value.number({
    name: 'Template Update Interval (seconds)',
    description:
      'How often to check for new templates and send updates to pools',
    required: true,
    default: 30,
    min: 1,
    max: 300,
    integer: true,
  }),

  // Fee Delta
  sv2feedelta: Value.number({
    name: 'Fee Delta (satoshis)',
    description:
      'Minimum fee difference in satoshis required to trigger a new template',
    required: true,
    default: 1000,
    min: 0,
    max: 1000000,
    integer: true,
  }),

  // Logging Settings
  debug: Value.text({
    name: 'Debug Categories',
    description:
      'Comma-separated debug categories (e.g., "sv2,ipc" or "all")',
    required: true,
    default: 'sv2',
    placeholder: 'sv2,ipc',
  }),

  loglevel: Value.text({
    name: 'Log Level',
    description: 'Log level for sv2 category (e.g., "sv2:trace", "sv2:debug")',
    required: true,
    default: 'sv2:debug',
    placeholder: 'sv2:debug',
  }),
})

export const setConfig = sdk.Action.withInput(
  // id
  'set-config',

  // metadata
  async ({ effects }) => ({
    name: 'Configure Template Provider',
    description:
      'Configure SV2 Template Provider settings for Bitcoin Core IPC connection and template generation',
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // form input specification
  inputSpec,

  // optionally pre-fill the input form
  async ({ effects }) => {
    const conf = await sv2TpConfFile.read().const(effects)
    if (!conf) {
      return null
    }
    // Return only the fields that are in inputSpec
    // Cast chain to the correct type
    const chain = conf.chain as 'main' | 'test' | 'signet' | 'regtest'
    return {
      testnet4Mode: conf.testnet4Mode,
      chain,
      sv2interval: conf.sv2interval,
      sv2feedelta: conf.sv2feedelta,
      debug: conf.debug,
      loglevel: conf.loglevel,
    }
  },

  // the execution function
  async ({ effects, input }) => {
    // Determine IPC path based on testnet4Mode
    // Both bitcoin-core-startos and bitcoind-testnet4-startos use the same socket name
    const ipcPath = 'unix:../ipc/bitcoin-core.sock'
    
    // Write directly to sv2-tp.conf - SDK handles the .conf format
    await sv2TpConfFile.merge(effects, {
      ...input,
      ipcconnect: ipcPath,
    })
  },
)

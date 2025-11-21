import { sdk } from '../sdk'
import { sv2TpConfFile } from '../fileModels/sv2-tp.conf'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
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
    // Return only the fields that are in inputSpec (exclude ipcconnect)
    // Cast chain to the correct type
    const chain = conf.chain as 'main' | 'test' | 'signet' | 'regtest'
    return {
      chain,
      sv2interval: conf.sv2interval,
      sv2feedelta: conf.sv2feedelta,
      debug: conf.debug,
      loglevel: conf.loglevel,
    }
  },

  // the execution function
  async ({ effects, input }) => {
    // Write directly to sv2-tp.conf - SDK handles the .conf format
    await sv2TpConfFile.merge(effects, {
      ...input,
      ipcconnect: 'unix', // Always unix for IPC socket
    })
  },
)

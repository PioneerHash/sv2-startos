import { sdk } from '../sdk'
import { sv2TpConfFile } from '../fileModels/sv2-tp.conf'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  // Testnet4 Mode Toggle
  testnet4Mode: Value.toggle({
    name: 'Use Testnet4',
    description:
      'Enable to connect to Bitcoin Core Testnet4. Disable to connect to Bitcoin Core Mainnet.',
    default: false,
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
    // Derive testnet4Mode from chain value
    const testnet4Mode = conf.chain === 'testnet4'
    return {
      testnet4Mode,
      sv2interval: conf.sv2interval,
      sv2feedelta: conf.sv2feedelta,
    }
  },

  // the execution function
  async ({ effects, input }) => {
    // Determine network chain based on testnet4Mode
    // Note: sv2-tp uses 'testnet4' for testnet4, not 'test'
    const chain = input.testnet4Mode ? 'testnet4' : 'main'

    // IPC path - absolute path to mounted IPC volume
    const ipcPath = 'unix:/ipc/bitcoin-core.sock'

    // Hardcoded logging configuration (production defaults)
    const loglevel = 'sv2:info'

    // Write configuration to sv2-tp.conf
    // Note: testnet4Mode is NOT written to the config file - it's only used internally
    await sv2TpConfFile.merge(effects, {
      chain,
      sv2interval: input.sv2interval,
      sv2feedelta: input.sv2feedelta,
      ipcconnect: ipcPath,
      loglevel,
    })
  },
)

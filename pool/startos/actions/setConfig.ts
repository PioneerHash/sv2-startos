import { sdk } from '../sdk'
import { configToml } from '../fileModels/config.toml'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  // Certificate Configuration
  cert_validity_sec: Value.number({
    name: 'Certificate Validity Duration',
    description: 'How long certificates are valid in seconds (1 hour = 3600, 1 day = 86400, 30 days = 2592000)',
    required: true,
    default: 3600,
    min: 300,
    max: 2592000,
    integer: true,
    units: 'seconds',
  }),

  // Coinbase Reward Configuration
  coinbase_reward_address: Value.text({
    name: 'Bitcoin Reward Address',
    description: 'Bitcoin address where mining rewards will be sent. Enter your Bitcoin address (e.g., bc1q... for mainnet or tb1q... for testnet). IMPORTANT: Verify this address carefully - all mining rewards will go here!',
    required: true,
    default: 'tb1qa0sm0hxzj0x25rh8gw5xlzwlsfvvyz8u96w3p8',
    placeholder: 'bc1q...',
    patterns: [
      {
        regex: '^[a-zA-Z0-9]{25,100}$',
        description: 'Must be a valid Bitcoin address',
      },
    ],
  }),

  pool_signature: Value.text({
    name: 'Pool Signature',
    description: 'Identifying string included in the coinbase transaction of every block mined by your pool',
    required: true,
    default: 'PioneerHashSv2',
    placeholder: 'PioneerHashSv2',
    maxLength: 100,
  }),

  // Server Configuration
  server_id: Value.number({
    name: 'Server ID',
    description: 'Unique identifier for this pool server (1-65535). Each pool instance must have a unique ID to ensure unique search space allocation across multiple servers',
    required: true,
    default: 1,
    min: 1,
    max: 65535,
    integer: true,
  }),

  // Template Provider Configuration
  tp_address: Value.text({
    name: 'Template Provider Address',
    description: 'IP address and port of the Template Provider service. Use 127.0.0.1:8442 if running locally on StartOS',
    required: true,
    default: '127.0.0.1:8442',
    placeholder: '127.0.0.1:8442',
    patterns: [
      {
        regex: '^[^:]+:[0-9]+$',
        description: 'Must be in format: address:port',
      },
    ],
  }),

  tp_authority_public_key: Value.text({
    name: 'Template Provider Authority Public Key',
    description: 'Authority public key of the Template Provider for secure authentication',
    required: true,
    default: '9bwHCYnjhbHm4AS3pWg9MtAH83mzWohoJJJDELYBqZhDNqszDLc',
    placeholder: '9bwHCYnjhbHm4AS3pWg9MtAH83mzWohoJJJDELYBqZhDNqszDLc',
  }),

  // Mining Difficulty & Share Configuration
  shares_per_minute: Value.number({
    name: 'Target Shares Per Minute',
    description: 'Target number of shares per minute for difficulty adjustment. Higher values result in lower difficulty',
    required: true,
    default: 6.0,
    min: 0.1,
    max: 60,
    integer: false,
    units: 'shares/min',
  }),

  share_batch_size: Value.number({
    name: 'Share Batch Size',
    description: 'Number of shares to batch together before processing. Larger batches improve efficiency but increase memory usage',
    required: true,
    default: 100,
    min: 1,
    max: 1000,
    integer: true,
    units: 'shares',
  }),
})

export const setConfig = sdk.Action.withInput(
  // id
  'set-config',

  // metadata
  async ({ effects }) => ({
    name: 'Configure Pool',
    description:
      'Configure SV2 Pool Server settings including authority keys, coinbase rewards, and Template Provider connection',
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // form input specification
  inputSpec,

  // optionally pre-fill the input form
  async ({ effects }) => {
    const config = await configToml.read().const(effects)
    if (!config) {
      return null
    }

    // Unwrap addr() from coinbase_reward_script for display
    let coinbase_reward_address = config.coinbase_reward_script
    if (coinbase_reward_address && coinbase_reward_address.startsWith('addr(') && coinbase_reward_address.endsWith(')')) {
      coinbase_reward_address = coinbase_reward_address.slice(5, -1)
    }

    return {
      ...config,
      coinbase_reward_address,
    }
  },

  // the execution function
  async ({ effects, input }) => {
    // Transform the user-friendly address input into the Bitcoin descriptor format
    // Users enter just the address (e.g., "bc1q..."), we wrap it with addr() for storage
    // This is stored as coinbase_reward_script in the config file
    const { coinbase_reward_address, ...restInput } = input
    const configData = {
      ...restInput,
      coinbase_reward_script: `addr(${coinbase_reward_address})`,
    }

    await configToml.merge(effects, configData)
  },
)

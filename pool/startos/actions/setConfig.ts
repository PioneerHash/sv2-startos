import { sdk } from '../sdk'
import { configToml } from '../fileModels/config.toml'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  // Pool Authority Keys
  authority_public_key: Value.text({
    name: 'Authority Public Key',
    description: 'Pool authority public key for SV2 protocol authentication',
    required: true,
    default: '9auqWEzQDVyd2oe1JVGFLMLHZtCo2FFqZwtKA5gd9xbuEu7PH72',
    placeholder: '9auqWEzQDVyd2oe1JVGFLMLHZtCo2FFqZwtKA5gd9xbuEu7PH72',
  }),
  
  authority_secret_key: Value.text({
    name: 'Authority Secret Key',
    description: 'Pool authority secret key (keep this secure!)',
    required: true,
    default: 'mkDLTBBRxdBv998612qipDYoTK3YUrqLe8uWw7gu3iXbSrn2n',
    placeholder: 'mkDLTBBRxdBv998612qipDYoTK3YUrqLe8uWw7gu3iXbSrn2n',
  }),
  
  // Certificate validity
  cert_validity_sec: Value.number({
    name: 'Certificate Validity (seconds)',
    description: 'Duration in seconds for certificate validity',
    required: true,
    default: 3600,
    min: 300,
    max: 86400,
    integer: true,
  }),
  
  // Coinbase Configuration
  coinbase_reward_script: Value.text({
    name: 'Coinbase Reward Script',
    description: 'Bitcoin address descriptor for coinbase rewards (e.g., addr(tb1q...))',
    required: true,
    default: 'addr(tb1qa0sm0hxzj0x25rh8gw5xlzwlsfvvyz8u96w3p8)',
    placeholder: 'addr(tb1qa0sm0hxzj0x25rh8gw5xlzwlsfvvyz8u96w3p8)',
  }),
  
  // Server Configuration
  server_id: Value.number({
    name: 'Server ID',
    description: 'Unique server ID to guarantee unique search space allocation',
    required: true,
    default: 1,
    min: 1,
    max: 65535,
    integer: true,
  }),
  
  pool_signature: Value.text({
    name: 'Pool Signature',
    description: 'String to be included in coinbase transaction',
    required: true,
    default: 'Stratum V2 SRI Pool',
    placeholder: 'Stratum V2 SRI Pool',
  }),
  
  // Template Provider Configuration
  tp_address: Value.text({
    name: 'Template Provider Address',
    description: 'IP address and port of the Template Provider (e.g., 127.0.0.1:8442)',
    required: true,
    default: '127.0.0.1:8442',
    placeholder: '127.0.0.1:8442',
  }),
  
  tp_authority_public_key: Value.text({
    name: 'Template Provider Authority Public Key',
    description: 'Authority public key of the Template Provider for authentication',
    required: true,
    default: '9bwHCYnjhbHm4AS3pWg9MtAH83mzWohoJJJDELYBqZhDNqszDLc',
    placeholder: '9bwHCYnjhbHm4AS3pWg9MtAH83mzWohoJJJDELYBqZhDNqszDLc',
  }),
  
  // Shares Configuration
  shares_per_minute: Value.number({
    name: 'Target Shares Per Minute',
    description: 'Target number of shares per minute',
    required: true,
    default: 6.0,
    min: 0.1,
    max: 60,
    integer: false,
  }),
  
  share_batch_size: Value.number({
    name: 'Share Batch Size',
    description: 'Number of shares to batch before processing',
    required: true,
    default: 10,
    min: 1,
    max: 1000,
    integer: true,
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
    return config
  },

  // the execution function
  async ({ effects, input }) => {
    await configToml.merge(effects, input)
  },
)

import { sdk } from '../sdk'
import { configToml } from '../fileModels/config.toml'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  // Full Template Mode
  full_template_mode_required: Value.toggle({
    name: 'Full Template Mode Required',
    description:
      'If enabled, JDS requires Job Declaration Clients to reveal the transactions they are going to mine on',
    default: false,
  }),

  // Authority Keys
  authority_public_key: Value.text({
    name: 'Authority Public Key',
    description: 'Authority public key for the Job Declaration Server',
    required: true,
    placeholder: 'Enter authority public key',
  }),

  authority_secret_key: Value.text({
    name: 'Authority Secret Key',
    description: 'Authority secret key for the Job Declaration Server',
    required: true,
    placeholder: 'Enter authority secret key',
    masked: true,
  }),

  cert_validity_sec: Value.number({
    name: 'Certificate Validity (seconds)',
    description: 'Duration in seconds for certificate validity',
    required: true,
    default: 3600,
    min: 60,
    max: 31536000, // 1 year
    integer: true,
  }),

  // Coinbase Configuration
  coinbase_reward_script: Value.text({
    name: 'Coinbase Reward Script',
    description:
      'Bitcoin address descriptor for coinbase rewards (e.g., wpkh([fingerprint/derivation]xpub...))',
    required: true,
    placeholder: 'Enter Bitcoin address descriptor',
  }),

  // Bitcoin Core RPC Configuration
  core_rpc_url: Value.text({
    name: 'Bitcoin Core RPC URL',
    description: 'URL for Bitcoin Core RPC connection',
    required: true,
    default: 'http://bitcoind.embassy:8332',
    placeholder: 'http://bitcoind.embassy:8332',
  }),

  core_rpc_port: Value.number({
    name: 'Bitcoin Core RPC Port',
    description: 'Port number for Bitcoin Core RPC',
    required: true,
    default: 8332,
    min: 1,
    max: 65535,
    integer: true,
  }),

  core_rpc_user: Value.text({
    name: 'Bitcoin Core RPC Username',
    description: 'Username for Bitcoin Core RPC authentication',
    required: true,
    placeholder: 'Enter RPC username',
  }),

  core_rpc_pass: Value.text({
    name: 'Bitcoin Core RPC Password',
    description: 'Password for Bitcoin Core RPC authentication',
    required: true,
    placeholder: 'Enter RPC password',
    masked: true,
  }),

  // Mempool Update Configuration
  mempool_update_interval: Value.number({
    name: 'Mempool Update Interval (seconds)',
    description: 'Time interval in seconds for mempool updates',
    required: true,
    default: 30,
    min: 1,
    max: 3600,
    integer: true,
  }),
})

export const setConfig = sdk.Action.withInput(
  // id
  'set-config',

  // metadata
  async ({ effects }) => ({
    name: 'Configure Job Declaration Server',
    description:
      'Configure Job Declaration Server settings including authority keys, Bitcoin Core RPC, and mempool update intervals',
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
    // Convert mempool_update_interval from object to number for display
    return {
      ...config,
      mempool_update_interval: config.mempool_update_interval.value,
    }
  },

  // the execution function
  async ({ effects, input }) => {
    // Convert mempool_update_interval from number to object for storage
    const configData = {
      ...input,
      // Fixed values
      log_file: './jd-server.log',
      listen_jd_address: '0.0.0.0:34264',
      // Convert interval to proper format
      mempool_update_interval: {
        unit: 'secs' as const,
        value: input.mempool_update_interval,
      },
    }
    await configToml.merge(effects, configData)
  },
)

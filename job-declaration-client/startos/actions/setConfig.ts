import { sdk } from '../sdk'
import { configToml } from '../fileModels/config.toml'

const { InputSpec, Value, List } = sdk

const upstreamSpec = InputSpec.of({
  authority_pubkey: Value.text({
    name: 'JDS Authority Public Key',
    description: 'The authority public key of the Job Declaration Server',
    required: true,
    default: '9auqWEzQDVyd2oe1JVGFLMLHZtCo2FFqZwtKA5gd9xbuEu7PH72',
    placeholder: '9auqWEzQDVyd2oe1JVGFLMLHZtCo2FFqZwtKA5gd9xbuEu7PH72',
  }),
  pool_address: Value.text({
    name: 'Pool Address',
    description: 'IP address or hostname of the upstream SV2 pool',
    required: true,
    default: '127.0.0.1',
    placeholder: '127.0.0.1',
  }),
  pool_port: Value.text({
    name: 'Pool Port',
    description: 'Port number for the upstream SV2 pool (typically 34254)',
    required: true,
    default: '34254',
    placeholder: '34254',
  }),
  jds_address: Value.text({
    name: 'JDS Address',
    description: 'IP address or hostname of the Job Declaration Server',
    required: true,
    default: '127.0.0.1',
    placeholder: '127.0.0.1',
  }),
  jds_port: Value.text({
    name: 'JDS Port',
    description: 'Port number for the Job Declaration Server (typically 34264)',
    required: true,
    default: '34264',
    placeholder: '34264',
  }),
})

export const inputSpec = InputSpec.of({
  // User Identity
  user_identity: Value.text({
    name: 'User Identity / Username',
    description: 'Username for pool connection',
    required: true,
    default: 'start9',
    placeholder: 'start9',
  }),

  // Shares Configuration
  shares_per_minute: Value.number({
    name: 'Target Shares Per Minute',
    description:
      'Target number of shares per minute applied to every downstream channel',
    required: true,
    default: 6.0,
    min: 0.1,
    max: 60,
    integer: false,
    units: 'shares/min',
  }),

  share_batch_size: Value.number({
    name: 'Share Batch Size',
    description: 'Number of shares to batch before submitting',
    required: true,
    default: 10,
    min: 1,
    max: 1000,
    integer: true,
    units: 'shares',
  }),

  // Mining Mode
  mode: Value.text({
    name: 'Mining Mode',
    description:
      'FULLTEMPLATE for full template mining (requires Template Provider), COINBASEONLY for coinbase-only mining',
    required: true,
    default: 'FULLTEMPLATE',
    placeholder: 'FULLTEMPLATE',
  }),

  // Template Provider Configuration
  tp_address: Value.text({
    name: 'Template Provider Address',
    description:
      'Address of the Template Provider (required for FULLTEMPLATE mode)',
    required: true,
    default: '127.0.0.1:8442',
    placeholder: '127.0.0.1:8442',
  }),

  tp_authority_public_key: Value.text({
    name: 'Template Provider Authority Public Key',
    description:
      'Authority public key of the Template Provider (leave empty for local TP, required for remote/hosted Template Providers)',
    required: false,
    default: '',
    placeholder: '9bwHCYnjhbHm4AS3pWg9MtAH83mzWohoJJJDELYBqZhDNqszDLc',
  }),

  // JDC Signature
  jdc_signature: Value.text({
    name: 'JDC Signature',
    description: 'String to be added into the Coinbase scriptSig',
    required: true,
    default: 'StartOS',
    placeholder: 'StartOS',
    maxLength: 100,
  }),

  // Solo Mining Fallback
  coinbase_reward_script: Value.text({
    name: 'Coinbase Reward Script',
    description:
      'Bitcoin address descriptor for solo mining fallback. Use format: addr(your_address). Example testnet address provided - replace with your own!',
    required: true,
    default: 'addr(tb1qa0sm0hxzj0x25rh8gw5xlzwlsfvvyz8u96w3p8)',
    placeholder: 'addr(bc1q...)',
  }),

  // Authority Keys
  authority_public_key: Value.text({
    name: 'Authority Public Key',
    description: 'Authority public key for authenticated connections (example key provided from sv2-apps)',
    required: true,
    default: '9auqWEzQDVyd2oe1JVGFLMLHZtCo2FFqZwtKA5gd9xbuEu7PH72',
    placeholder: '9auqWEzQDVyd2oe1JVGFLMLHZtCo2FFqZwtKA5gd9xbuEu7PH72',
  }),

  authority_secret_key: Value.text({
    name: 'Authority Secret Key',
    description: 'Authority secret key for authenticated connections (example key provided from sv2-apps)',
    required: true,
    default: 'mkDLTBBRxdBv998612qipDYoTK3YUrqLe8uWw7gu3iXbSrn2n',
    placeholder: 'mkDLTBBRxdBv998612qipDYoTK3YUrqLe8uWw7gu3iXbSrn2n',
  }),

  cert_validity_sec: Value.number({
    name: 'Certificate Validity',
    description: 'Certificate validity duration in seconds',
    required: true,
    default: 3600,
    min: 60,
    max: 31536000,
    integer: true,
    units: 'seconds',
  }),

  // Upstream JDS Connections
  upstreams: Value.list(
    List.obj(
      {
        name: 'Upstream Job Declaration Servers',
        description:
          'Job Declaration Server connections (add multiple for failover support). The first JDS will be used as primary, others as backups',
      },
      {
        spec: upstreamSpec,
        displayAs: '{{pool_address}}:{{pool_port}} via {{jds_address}}:{{jds_port}}',
        uniqueBy: 'pool_address',
      },
    ),
  ),
})

export const setConfig = sdk.Action.withInput(
  // id
  'set-config',

  // metadata
  async ({ effects }) => ({
    name: 'Configure Job Declaration Client',
    description:
      'Configure Job Declaration Client settings for pool connections and mining parameters',
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
    const configData = {
      // Fixed values
      listening_address: '0.0.0.0:34265' as const,
      min_supported_version: 2 as const,
      max_supported_version: 2 as const,
      log_file: './jd-client.log' as const,

      // User-configurable values
      ...input,
    }
    await configToml.merge(effects, configData)
  },
)

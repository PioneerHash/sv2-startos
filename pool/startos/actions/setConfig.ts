import { sdk } from '../sdk'
import { configToml } from '../fileModels/config.toml'

const { InputSpec, Value, Variants } = sdk

export const inputSpec = InputSpec.of({
  // Pool Identity Configuration
  authority_public_key: Value.text({
    name: 'Authority Public Key',
    description: 'Pool authority public key for Noise protocol authentication',
    required: true,
    default: '9auqWEzQDVyd2oe1JVGFLMLHZtCo2FFqZwtKA5gd9xbuEu7PH72',
  }),

  authority_secret_key: Value.text({
    name: 'Authority Secret Key',
    description:
      'Pool authority secret key for Noise protocol (keep secure)',
    required: true,
    masked: true,
    default: 'mkDLTBBRxdBv998612qipDYoTK3YUrqLe8uWw7gu3iXbSrn2n',
  }),

  cert_validity_sec: Value.number({
    name: 'Certificate Validity Duration',
    description:
      'Duration for which generated certificates are valid (1 hour = 3600)',
    required: true,
    default: 3600,
    min: 300,
    max: 86400,
    integer: true,
    units: 'seconds',
  }),

  // Coinbase Reward Configuration
  coinbase_reward_address: Value.text({
    name: 'Mining Reward Address',
    description:
      'Bitcoin address where mining rewards will be sent. IMPORTANT: Verify this address carefully - all mining rewards will go here!',
    required: true,
    default: 'tb1qa0sm0hxzj0x25rh8gw5xlzwlsfvvyz8u96w3p8',
    placeholder: 'bc1q... or tb1q...',
    patterns: [
      {
        regex: '^[a-zA-Z0-9]{25,100}$',
        description: 'Must be a valid Bitcoin address',
      },
    ],
  }),

  server_id: Value.number({
    name: 'Server ID',
    description:
      'Unique identifier for this pool server. Each pool instance must have a unique ID to ensure unique search space allocation across different servers',
    required: true,
    default: Math.floor(Math.random() * 65535) + 1,
    min: 1,
    max: 65535,
    integer: true,
  }),

  pool_signature: Value.text({
    name: 'Pool Signature',
    description:
      'Text included in the coinbase transaction of mined blocks. This appears on the blockchain.',
    required: true,
    default: `Pool-${Math.random().toString(36).substring(2, 15)}`,
    maxLength: 100,
    warning:
      'PRIVACY WARNING: This signature is publicly visible on the blockchain. Using identifiable information (like your name, location, or email) will permanently link your identity to this pool and compromise privacy. Use a random or generic string instead.',
  }),

  // Shares Configuration
  shares_per_minute: Value.number({
    name: 'Target Shares Per Minute',
    description:
      'Expected number of shares per minute (determines difficulty targets)',
    required: true,
    default: 6.0,
    min: 0.1,
    max: 1000,
    integer: false,
    units: 'shares/min',
  }),

  share_batch_size: Value.number({
    name: 'Share Batch Size',
    description: 'Number of shares to acknowledge in a batch',
    required: true,
    default: 10,
    min: 1,
    max: 1000,
    integer: true,
    units: 'shares',
  }),

  // Template Provider Mode Selection - THREE-WAY UNION
  template_provider: Value.union({
    name: 'Template Provider',
    description: 'Choose how the pool obtains block templates for mining',
    default: 'local-sv2-tp',
    variants: Variants.of({
      'local-sv2-tp': {
        name: 'Local SV2 Template Provider',
        description:
          'Automatically connects to the SV2 Template Provider service running on this StartOS. Connection details are retrieved automatically. Requires: SV2 Template Provider service installed and running.',
        spec: InputSpec.of({}),
      },
      'remote-sv2-tp': {
        name: 'Remote SV2 Template Provider',
        spec: InputSpec.of({
          address: Value.text({
            name: 'Template Provider Address',
            description:
              'IP address and port of the remote Template Provider',
            required: true,
            default: '75.119.150.111:8442',
            placeholder: '75.119.150.111:8442',
            patterns: [
              {
                regex: '^[\\w\\.\\-]+:\\d+$',
                description: 'Must be in format: host:port',
              },
            ],
          }),
          public_key: Value.text({
            name: 'Template Provider Public Key',
            description:
              'Authority public key of the remote Template Provider for secure connection',
            required: true,
            default: '9bwHCYnjhbHm4AS3pWg9MtAH83mzWohoJJJDELYBqZhDNqszDLc',
            placeholder: '9bwHCYnjhbHm4AS3pWg9MtAH83mzWohoJJJDELYBqZhDNqszDLc',
          }),
        }),
      },
      'bitcoin-core-ipc': {
        name: 'Bitcoin Core IPC',
        description:
          'Connect directly to Bitcoin Core via IPC socket. CRITICAL: Bitcoin Core v30.0+ with IPC enabled (ipcbind setting) is required. Pool will validate IPC availability on startup and fail if not enabled.',
        spec: InputSpec.of({
          network: Value.select({
            name: 'Bitcoin Network',
            description: 'Select the Bitcoin network to use',
            default: 'mainnet',
            values: {
              mainnet: 'Mainnet (requires Bitcoin Core installed)',
              testnet4: 'Testnet4 (requires Bitcoin Core Testnet4 installed)',
            },
          }),
          fee_threshold: Value.number({
            name: 'Fee Threshold',
            description:
              'Minimum fee threshold for transaction inclusion in templates',
            required: true,
            default: 100,
            integer: true,
            min: 0,
            units: 'satoshis',
          }),
          min_interval: Value.number({
            name: 'Minimum Interval',
            description:
              'Minimum time between template updates from Bitcoin Core',
            required: true,
            default: 5,
            integer: true,
            min: 1,
            max: 60,
            units: 'seconds',
          }),
        }),
      },
    }),
  }),
})

export const setConfig = sdk.Action.withInput(
  // id
  'set-config',

  // metadata
  async ({ effects }) => ({
    name: 'Configure Pool',
    description:
      'Configure Pioneer Hash SV2 Pool settings including template provider source and mining rewards',
    warning: 'Changing template provider mode will require a pool restart',
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // form input specification
  inputSpec,

  // optionally pre-fill the input form
  async ({ effects }) => {
    let config
    try {
      config = await configToml.read().const(effects)
    } catch (e) {
      return null
    }

    if (!config) {
      return null
    }

    // Unwrap addr() from coinbase_reward_script for display
    let coinbase_reward_address = config.coinbase_reward_script || ''
    if (
      coinbase_reward_address.startsWith('addr(') &&
      coinbase_reward_address.endsWith(')')
    ) {
      coinbase_reward_address = coinbase_reward_address.slice(5, -1)
    }

    // Convert stored config back to form format
    const templateProvider: any = {
      selection: config.template_provider_mode || 'local-sv2-tp',
      value: {},
    }

    switch (config.template_provider_mode) {
      case 'remote-sv2-tp':
        templateProvider.value = {
          address: config.tp_address_remote || '',
          public_key: config.tp_public_key_remote || '',
        }
        break
      case 'bitcoin-core-ipc':
        templateProvider.value = {
          network: config.bitcoin_network || 'mainnet',
          fee_threshold: config.bitcoin_fee_threshold || 100,
          min_interval: config.bitcoin_min_interval || 5,
        }
        break
      case 'local-sv2-tp':
      default:
        templateProvider.value = {} // Empty - no fields needed
        break
    }

    return {
      authority_public_key: config.authority_public_key,
      authority_secret_key: config.authority_secret_key,
      cert_validity_sec: config.cert_validity_sec,
      coinbase_reward_address,
      server_id: config.server_id,
      pool_signature: config.pool_signature,
      shares_per_minute: config.shares_per_minute,
      share_batch_size: config.share_batch_size,
      template_provider: templateProvider,
    }
  },

  // the execution function
  async ({ effects, input }) => {
    // Process the configuration based on selected template provider mode
    const mode = input.template_provider.selection
    let tpConfig: any = {}

    switch (mode) {
      case 'local-sv2-tp': {
        // Retrieve connection info from local Template Provider service
        try {
          const tpInterface = await effects.getServiceInterface({
            packageId: 'sv2-template-provider',
            serviceInterfaceId: 'template-provider',
          })

          if (!tpInterface) {
            throw new Error('Template Provider interface not found')
          }

          // Use LAN address for local communication - check all possible address fields
          const tpHost =
            (tpInterface as any).lanAddress ||
            (tpInterface as any).address ||
            '127.0.0.1'
          tpConfig = {
            template_provider_mode: 'local-sv2-tp',
            tp_address_local: `${tpHost}:8442`,
            tp_address_remote: '',
            tp_public_key_remote: '',
            bitcoin_network: '',
            bitcoin_ipc_socket: '',
            bitcoin_fee_threshold: 0,
            bitcoin_min_interval: 0,
          }
        } catch (error) {
          throw new Error(
            'Failed to connect to local Template Provider. ' +
              'Ensure the SV2 Template Provider service is installed and running on this StartOS.',
          )
        }
        break
      }

      case 'remote-sv2-tp': {
        const tpValue = input.template_provider.value as any
        tpConfig = {
          template_provider_mode: 'remote-sv2-tp',
          tp_address_local: '',
          tp_address_remote: tpValue.address,
          tp_public_key_remote: tpValue.public_key,
          bitcoin_network: '',
          bitcoin_ipc_socket: '',
          bitcoin_fee_threshold: 0,
          bitcoin_min_interval: 0,
        }
        break
      }

      case 'bitcoin-core-ipc': {
        const tpValue = input.template_provider.value as any
        const network = tpValue.network
        // IPC socket will be at /ipc/node.sock when we mount the Bitcoin Core IPC volume
        tpConfig = {
          template_provider_mode: 'bitcoin-core-ipc',
          tp_address_local: '',
          tp_address_remote: '',
          tp_public_key_remote: '',
          bitcoin_network: network,
          bitcoin_ipc_socket: '/ipc/node.sock',
          bitcoin_fee_threshold: tpValue.fee_threshold,
          bitcoin_min_interval: tpValue.min_interval,
        }
        break
      }
    }

    // Build complete configuration
    const config = {
      authority_public_key: input.authority_public_key,
      authority_secret_key: input.authority_secret_key,
      cert_validity_sec: input.cert_validity_sec,
      listen_address: '0.0.0.0:34254',
      coinbase_reward_script: `addr(${input.coinbase_reward_address})`,
      server_id: input.server_id,
      pool_signature: input.pool_signature,
      log_file: './pool.log',
      shares_per_minute: input.shares_per_minute,
      share_batch_size: input.share_batch_size,
      supported_extensions: JSON.stringify([]), // Empty for now
      required_extensions: JSON.stringify([]), // Empty for now
      ...tpConfig,
    }

    // Write configuration
    await configToml.write(effects, config)

    // Return success message
    const modeName =
      mode === 'local-sv2-tp'
        ? 'Local SV2 Template Provider'
        : mode === 'remote-sv2-tp'
          ? 'Remote SV2 Template Provider'
          : 'Bitcoin Core IPC'

    return {
      version: '1',
      title: 'Configuration Saved',
      message: `Pool configured to use ${modeName} for block templates. Restart the pool for changes to take effect.`,
      result: null,
    }
  },
)

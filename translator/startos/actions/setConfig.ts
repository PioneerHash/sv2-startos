import { sdk } from '../sdk'
import { configToml } from '../fileModels/config.toml'

const { InputSpec, Value, List } = sdk

const upstreamSpec = InputSpec.of({
  address: Value.text({
    name: 'Pool Address',
    description: 'IP address or hostname of the upstream SV2 pool',
    required: true,
    default: '75.119.150.111',
    placeholder: '75.119.150.111',
  }),
  port: Value.number({
    name: 'Pool Port',
    description:
      'Port number for the upstream SV2 pool (typically 34254 for pool, 34265 for JDC)',
    required: true,
    default: 34254,
    min: 1,
    max: 65535,
    integer: true,
  }),
  authority_pubkey: Value.text({
    name: 'Authority Public Key',
    description: 'The authority public key of the upstream SV2 pool',
    required: true,
    default: '9auqWEzQDVyd2oe1JVGFLMLHZtCo2FFqZwtKA5gd9xbuEu7PH72',
    placeholder: '9auqWEzQDVyd2oe1JVGFLMLHZtCo2FFqZwtKA5gd9xbuEu7PH72',
  }),
})

export const inputSpec = InputSpec.of({
  // User Identity
  user_identity: Value.text({
    name: 'User Identity / Username',
    description:
      'Username for pool connection. Will be appended with a counter for each mining client (e.g., username.miner1, username.miner2)',
    required: true,
    default: 'start9',
    placeholder: 'start9',
  }),

  // Extranonce Configuration
  downstream_extranonce2_size: Value.number({
    name: 'Downstream Extranonce2 Size',
    description:
      'Extranonce2 size for downstream connections. Controls the rollable part of the extranonce for downstream SV1 miners (Max for CGminer: 8, Min: 2)',
    required: true,
    default: 4,
    min: 2,
    max: 16,
    integer: true,
  }),

  // Channel Aggregation
  aggregate_channels: Value.toggle({
    name: 'Aggregate Channels',
    description:
      'If enabled, all miners share one upstream channel. If disabled, each miner gets its own channel',
    default: true,
  }),

  // Downstream Difficulty Configuration
  downstream_difficulty_config: Value.object(
    {
      name: 'Downstream Difficulty Settings',
      description: 'Difficulty settings for mining devices',
    },
    InputSpec.of({
      min_individual_miner_hashrate: Value.number({
        name: 'Minimum Miner Hashrate (TH/s)',
        description:
          'Hashrate of the weakest miner in terahashes per second (e.g., 10 TH/s)',
        required: true,
        default: 10,
        min: 0.001,
        max: 10000,
        integer: false,
      }),
      shares_per_minute: Value.number({
        name: 'Target Shares Per Minute',
        description:
          'Target number of shares per minute each miner should submit',
        required: true,
        default: 6.0,
        min: 0.1,
        max: 60,
        integer: false,
      }),
      enable_vardiff: Value.toggle({
        name: 'Enable Variable Difficulty',
        description:
          'Enable variable difficulty adjustment (set to false when using with Job Declarator Client)',
        default: true,
      }),
    }),
  ),

  // Upstream SV2 Pool/JDC Connections
  upstreams: Value.list(
    List.obj(
      {
        name: 'Upstream Pools',
        description:
          'SV2 pool connections (add multiple for failover support). The first pool will be used as primary, others as backups',
      },
      {
        spec: upstreamSpec,
        displayAs: '{{address}}:{{port}}',
        uniqueBy: 'address',
      },
    ),
  ),
})

export const setConfig = sdk.Action.withInput(
  // id
  'set-config',

  // metadata
  async ({ effects }) => ({
    name: 'Configure Translator',
    description:
      'Configure SV2 Translator Proxy settings for pool and mining device connections',
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
    // Convert H/s to TH/s for display
    return {
      ...config,
      downstream_difficulty_config: {
        ...config.downstream_difficulty_config,
        min_individual_miner_hashrate:
          config.downstream_difficulty_config.min_individual_miner_hashrate / 1e12,
      },
    }
  },

  // the execution function
  async ({ effects, input }) => {
    // Convert TH/s to H/s for storage
    const configData = {
      ...input,
      downstream_difficulty_config: {
        ...input.downstream_difficulty_config,
        min_individual_miner_hashrate:
          input.downstream_difficulty_config.min_individual_miner_hashrate * 1e12,
      },
    }
    await configToml.merge(effects, configData)
  },
)

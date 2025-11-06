import { matches, FileHelper } from '@start9labs/start-sdk'
const { object, string, number, literal, boolean, array } = matches

const shape = object({
  // Downstream Mining Device Connection
  // We don't want people changing Downstream address and port
  downstream_address: literal('0.0.0.0').onMismatch('0.0.0.0'),
  downstream_port: literal(34255).onMismatch(34255),

  // Protocol Version Support
  // We don't want people changing protocol versions
  min_supported_version: literal(2).onMismatch(2),
  max_supported_version: literal(2).onMismatch(2),

  // Extranonce2 size for downstream connections
  // This controls the rollable part of the extranonce for downstream SV1 miners
  // Max value for CGminer: 8, Min value: 2
  downstream_extranonce2_size: number,

  // User identity/username for pool connection
  // This will be appended with a counter for each mining client (e.g., username.miner1, username.miner2)
  user_identity: string,

  // Aggregate channels: if true, all miners share one upstream channel; if false, each miner gets its own channel
  aggregate_channels: boolean,

  // Optional Log File
  log_file: literal('./tproxy.log').onMismatch('./tproxy.log'),

  // Downstream Difficulty Configuration
  downstream_difficulty_config: object({
    min_individual_miner_hashrate: number,
    shares_per_minute: number,
    // Enable variable difficulty adjustment (true by default, set to false when using with JDC)
    enable_vardiff: boolean,
  }),

  // Upstream SV2 Pool/JDC Connections (array of upstreams for failover support)
  upstreams: array(object({
    address: string,
    port: number,
    authority_pubkey: string,
  })),
})

export const configToml = FileHelper.toml(
  {
    volumeId: 'main',
    subpath: '/config.toml',
  },
  shape,
)

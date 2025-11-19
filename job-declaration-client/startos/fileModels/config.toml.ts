import { matches, FileHelper } from '@start9labs/start-sdk'
const { object, string, number, literal, array } = matches

const shape = object({
  // JD Client listening address - fixed
  listening_address: literal('0.0.0.0:34265').onMismatch('0.0.0.0:34265'),

  // Protocol Version Support - fixed
  min_supported_version: literal(2).onMismatch(2),
  max_supported_version: literal(2).onMismatch(2),

  // Auth keys for open encrypted connection downstream
  authority_public_key: string,
  authority_secret_key: string,
  cert_validity_sec: number,

  // User identity/username for pool connection
  user_identity: string,

  // Target number of shares per minute applied to every downstream channel
  shares_per_minute: number,

  // Share batch size
  share_batch_size: number,

  // JDC supports two modes: "FULLTEMPLATE" - full template mining, "COINBASEONLY" - coinbase-only mining
  mode: string,

  // Template Provider config
  tp_address: string,
  // Optional: only needed for remote/hosted Template Providers (can be empty string)
  tp_authority_public_key: string,

  // String to be added into the Coinbase scriptSig
  jdc_signature: string,

  // Coinbase reward script for Solo Mining (fallback solution)
  coinbase_reward_script: string,

  // Optional Log File
  log_file: literal('./jd-client.log').onMismatch('./jd-client.log'),

  // List of upstreams (JDS) used as backup endpoints
  upstreams: array(object({
    authority_pubkey: string,
    pool_address: string,
    pool_port: string,
    jds_address: string,
    jds_port: string,
  })),
})

export const configToml = FileHelper.toml(
  {
    volumeId: 'main',
    subpath: '/config.toml',
  },
  shape,
)

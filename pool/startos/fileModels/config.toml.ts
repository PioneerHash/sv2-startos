import { matches, FileHelper } from '@start9labs/start-sdk'
const { object, string, number, literal } = matches

const shape = object({
  // Pool Authority Keys
  authority_public_key: string,
  authority_secret_key: string,

  // Certificate validity duration
  cert_validity_sec: number,

  // Test-only plain connection (optional, for development/testing)
  test_only_listen_adress_plain: string,

  // Listen address for downstream connections (translators/proxies)
  // We don't want people changing the listen address
  listen_address: literal('0.0.0.0:34254').onMismatch('0.0.0.0:34254'),

  // Coinbase reward script (Bitcoin address descriptor)
  coinbase_reward_script: string,

  // Server ID for unique search space allocation
  server_id: number,

  // Pool signature for coinbase tx
  pool_signature: string,

  // Optional Log File
  log_file: literal('./pool.log').onMismatch('./pool.log'),

  // Template Provider Configuration
  tp_address: string,
  // Optional: only needed for remote/hosted Template Providers
  tp_authority_public_key: string,

  // Shares configuration
  shares_per_minute: number,
  share_batch_size: number,
})

export const configToml = FileHelper.toml(
  {
    volumeId: 'main',
    subpath: '/config.toml',
  },
  shape,
)

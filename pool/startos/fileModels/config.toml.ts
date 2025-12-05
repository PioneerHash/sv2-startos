import { matches, FileHelper } from '@start9labs/start-sdk'
const { object, string, number, literal } = matches

const shape = object({
  // Pool Authority Keys
  authority_public_key: string,
  authority_secret_key: string,

  // Certificate validity duration
  cert_validity_sec: number,

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

  // Shares configuration
  shares_per_minute: number,
  share_batch_size: number,

  // Protocol extensions
  supported_extensions: string, // Serialized array
  required_extensions: string, // Serialized array

  // Template Provider Mode: 'local-sv2-tp' | 'remote-sv2-tp' | 'bitcoin-core-ipc'
  template_provider_mode: string,

  // Local SV2 Template Provider configuration
  tp_address_local: string,

  // Remote SV2 Template Provider configuration
  tp_address_remote: string,
  tp_public_key_remote: string,

  // Bitcoin Core IPC configuration
  bitcoin_network: string, // 'mainnet' | 'testnet4'
  bitcoin_ipc_socket: string,
  bitcoin_fee_threshold: number,
  bitcoin_min_interval: number,
})

export const configToml = FileHelper.toml(
  {
    volumeId: 'main',
    subpath: '/config.toml',
  },
  shape,
)

import { VersionGraph } from '@start9labs/start-sdk'
import { current, other } from './versions'
import { configToml } from '../fileModels/config.toml'
import { sdk } from '../sdk'
import { setConfig } from '../actions/setConfig'

export const versionGraph = VersionGraph.of({
  current,
  other,
  preInstall: async (effects) => {
    ;(await Promise.all([
      configToml.write(effects, {
        // Pool Authority Keys (to be configured by user)
        authority_public_key: 'PLACEHOLDER_PUBLIC_KEY',
        authority_secret_key: 'PLACEHOLDER_SECRET_KEY',

        // Certificate validity duration (30 days)
        cert_validity_sec: 2592000,

        // Listen address for downstream connections
        listen_address: '0.0.0.0:34254',

        // Coinbase reward script (to be configured by user)
        coinbase_reward_script: 'PLACEHOLDER_BITCOIN_ADDRESS',

        // Server ID for unique search space allocation
        server_id: 0,

        // Pool signature for coinbase tx
        pool_signature: 'start9',

        // Log File
        log_file: './pool.log',

        // Template Provider Configuration
        tp_address: '127.0.0.1:8442',
        tp_authority_public_key: 'PLACEHOLDER_TP_PUBKEY',

        // Shares configuration
        shares_per_minute: 6.0,
        share_batch_size: 100,
      }),
    ]),
      // critical - needs to be done before start
      // important - dismissible
      // optional - less in the user's face
      await sdk.action.createOwnTask(effects, setConfig, 'critical', {
        reason: 'Configure your SV2 Pool settings',
      }))
  },
})

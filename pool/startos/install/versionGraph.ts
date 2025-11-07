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
        // Pool Authority Keys - These are example keys from SV2 reference implementation
        // Users should generate their own keys for production use
        authority_public_key: '9auqWEzQDVyd2oe1JVGFLMLHZtCo2FFqZwtKA5gd9xbuEu7PH72',
        authority_secret_key: 'mkDLTBBRxdBv998612qipDYoTK3YUrqLe8uWw7gu3iXbSrn2n',

        // Certificate validity duration (1 hour default)
        cert_validity_sec: 3600,

        // Listen address for downstream connections (translators/proxies)
        listen_address: '0.0.0.0:34254',

        // Coinbase reward script - default testnet address (users must configure their own)
        coinbase_reward_script: 'addr(tb1qa0sm0hxzj0x25rh8gw5xlzwlsfvvyz8u96w3p8)',

        // Server ID for unique search space allocation
        server_id: 1,

        // Pool signature for coinbase tx
        pool_signature: 'PioneerHashSv2',

        // Log File
        log_file: './pool.log',

        // Template Provider Configuration
        // Default assumes local Template Provider service
        tp_address: '127.0.0.1:8442',
        tp_authority_public_key: '9bwHCYnjhbHm4AS3pWg9MtAH83mzWohoJJJDELYBqZhDNqszDLc',

        // Shares configuration
        shares_per_minute: 6.0,
        share_batch_size: 10,
      }),
    ]),
      // critical - needs to be done before start
      // important - dismissible
      // optional - less in the user's face
      await sdk.action.createOwnTask(effects, setConfig, 'critical', {
        reason: 'Configure your SV2 Pool settings including authority keys, Bitcoin address, and Template Provider connection',
      }))
  },
})

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
        // Full Template Mode
        full_template_mode_required: false,

        // Authority Keys (placeholder values - user must configure)
        authority_public_key: 'CHANGE_ME_authority_public_key',
        authority_secret_key: 'CHANGE_ME_authority_secret_key',
        cert_validity_sec: 3600,

        // Coinbase Configuration (placeholder - user must configure)
        coinbase_reward_script: 'CHANGE_ME_bitcoin_address_descriptor',

        // Fixed Log File
        log_file: './jd-server.log',

        // Fixed JD Address
        listen_jd_address: '0.0.0.0:34264',

        // Bitcoin Core RPC Configuration (default to local bitcoind)
        core_rpc_url: 'http://bitcoind.embassy:8332',
        core_rpc_port: 8332,
        core_rpc_user: 'CHANGE_ME_rpc_username',
        core_rpc_pass: 'CHANGE_ME_rpc_password',

        // Mempool Update Interval
        mempool_update_interval: {
          unit: 'secs',
          value: 30,
        },
      }),
    ]),
      // critical - needs to be done before start
      // important - dismissible
      // optional - less in the user's face
      await sdk.action.createOwnTask(effects, setConfig, 'critical', {
        reason: 'Configure your Job Declaration Server settings',
      }))
  },
})

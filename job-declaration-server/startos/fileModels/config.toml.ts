import { matches, FileHelper } from '@start9labs/start-sdk'
const { object, string, number, literal, boolean } = matches

const shape = object({
  // If set to true, JDS requires JDC to reveal the transactions they are going to mine on
  full_template_mode_required: boolean,

  // SRI Pool config
  // We don't want people changing authority keys
  authority_public_key: string,
  authority_secret_key: string,
  cert_validity_sec: number,

  // Coinbase reward script (Bitcoin address descriptor)
  coinbase_reward_script: string,

  // Optional Log File
  log_file: literal('./jd-server.log').onMismatch('./jd-server.log'),

  // SRI Pool JD config - fixed address and port
  listen_jd_address: literal('0.0.0.0:34264').onMismatch('0.0.0.0:34264'),

  // RPC config for mempool (can be the same as Template Provider if correctly configured)
  core_rpc_url: string,
  core_rpc_port: number,
  core_rpc_user: string,
  core_rpc_pass: string,

  // Time interval used for JDS mempool update
  mempool_update_interval: object({
    unit: literal('secs').onMismatch('secs'),
    value: number,
  }),
})

export const configToml = FileHelper.toml(
  {
    volumeId: 'main',
    subpath: '/config.toml',
  },
  shape,
)

import { configToml } from './fileModels/config.toml'
import { sdk } from './sdk'

export const main = sdk.setupMain(async ({ effects, started }) => {
  /**
   * ======================== Setup ========================
   */
  console.info('Starting Pioneer Hash SV2 Pool!')

  // Read and validate configuration
  const config = await configToml.read().const(effects)

  // Validate critical configuration fields before starting
  const defaultTestnetAddress = 'addr(tb1qa0sm0hxzj0x25rh8gw5xlzwlsfvvyz8u96w3p8)'

  if (
    !config ||
    !config.coinbase_reward_script ||
    config.coinbase_reward_script === defaultTestnetAddress
  ) {
    throw new Error(
      'Configuration Required: You must configure a Bitcoin address for mining rewards. ' +
        'The default testnet address cannot be used. ' +
        'Please run the "Configure Pool" action and enter your Bitcoin address where mining rewards should be sent.',
    )
  }

  if (!config.template_provider_mode) {
    throw new Error(
      'Configuration Required: You must select a template provider mode. ' +
        'Run the "Configure Pool" action to choose how the pool obtains block templates.',
    )
  }

  /**
   * ======================== Generate Config File ========================
   *
   * The pool binary expects a specific TOML structure with nested tables.
   * We generate the config file as a string to ensure proper formatting.
   */
  let configContent = `# Pioneer Hash SV2 Pool Configuration
authority_public_key = "${config.authority_public_key}"
authority_secret_key = "${config.authority_secret_key}"
cert_validity_sec = ${config.cert_validity_sec}
listen_address = "${config.listen_address}"

coinbase_reward_script = "${config.coinbase_reward_script}"
server_id = ${config.server_id}
pool_signature = "${config.pool_signature}"

log_file = "${config.log_file}"

shares_per_minute = ${config.shares_per_minute}
share_batch_size = ${config.share_batch_size}

supported_extensions = []
required_extensions = []

`

  // Add template provider configuration based on mode
  switch (config.template_provider_mode) {
    case 'local-sv2-tp':
      configContent += `# Local SV2 Template Provider Configuration
[template_provider_type.Sv2Tp]
address = "${config.tp_address_local}"
`
      break

    case 'remote-sv2-tp':
      configContent += `# Remote SV2 Template Provider Configuration
[template_provider_type.Sv2Tp]
address = "${config.tp_address_remote}"
public_key = "${config.tp_public_key_remote}"
`
      break

    case 'bitcoin-core-ipc':
      configContent += `# Bitcoin Core IPC Configuration
[template_provider_type.BitcoinCoreIpc]
unix_socket_path = "${config.bitcoin_ipc_socket}"
fee_threshold = ${config.bitcoin_fee_threshold}
min_interval = ${config.bitcoin_min_interval}
`
      break

    default:
      throw new Error(
        `Unknown template provider mode: ${config.template_provider_mode}`,
      )
  }

  // Write the formatted config file
  const initContainer = await sdk.SubContainer.of(
    effects,
    { imageId: 'sv2-pool' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: null,
      mountpoint: '/data',
      readonly: false,
    }),
    'sv2-pool-init',
  )

  await initContainer.exec([
    'sh',
    '-c',
    `cat > /data/config.toml << 'EOF'\n${configContent}\nEOF`,
  ])
  await initContainer.destroy()

  console.info(
    `Pool configured with ${config.template_provider_mode} template provider`,
  )

  /**
   * ======================== Setup Mounts ========================
   *
   * Mount volumes based on template provider mode
   */
  const mounts = sdk.Mounts.of().mountVolume({
    volumeId: 'main',
    subpath: null,
    mountpoint: '/data',
    readonly: false,
  })

  // Mount Bitcoin Core IPC socket if using IPC mode
  if (config.template_provider_mode === 'bitcoin-core-ipc') {
    const bitcoindServiceId =
      config.bitcoin_network === 'testnet4'
        ? 'bitcoind-testnet4'
        : 'bitcoind'

    mounts.mountDependency({
      dependencyId: bitcoindServiceId,
      volumeId: 'ipc',
      subpath: null,
      mountpoint: '/ipc',
      readonly: true,
    })

    console.info(
      `Mounting ${bitcoindServiceId} IPC socket for direct Bitcoin Core connection`,
    )
  }

  /**
   * ======================== Daemons ========================
   *
   * Create the pool daemon that runs the pool_sv2 binary
   */
  const subcontainer = await sdk.SubContainer.of(
    effects,
    { imageId: 'sv2-pool' },
    mounts,
    'sv2-pool-sub',
  )

  // Validate IPC socket exists if using Bitcoin Core IPC mode
  if (config.template_provider_mode === 'bitcoin-core-ipc') {
    console.info('Validating Bitcoin Core IPC socket availability...')
    const ipcCheck = await subcontainer.exec([
      'test',
      '-S',
      config.bitcoin_ipc_socket,
    ])

    if (ipcCheck.exitCode !== 0) {
      await subcontainer.destroy()
      throw new Error(
        `Bitcoin Core IPC socket not found at ${config.bitcoin_ipc_socket}. ` +
          `Ensure Bitcoin Core has IPC enabled in its configuration. ` +
          `The 'ipcbind' option must be set in Bitcoin Core settings.`,
      )
    }
    console.info('Bitcoin Core IPC socket validated successfully')
  }

  const daemons = sdk.Daemons.of(effects, started).addDaemon('primary', {
    subcontainer,
    exec: {
      command: ['pool_sv2', '-c', '/data/config.toml'],
    },
    ready: {
      display: 'Pioneer Hash SV2 Pool Service',
      fn: () =>
        sdk.healthCheck.checkPortListening(effects, 34254, {
          successMessage: 'Pioneer Hash SV2 Pool is accepting connections',
          errorMessage: 'Pioneer Hash SV2 Pool is not ready',
        }),
    },
    requires: [],
  })

  // Add IPC health check if using Bitcoin Core IPC mode
  if (config.template_provider_mode === 'bitcoin-core-ipc') {
    daemons.addHealthCheck('ipc-validation', {
      ready: {
        display: 'Bitcoin Core IPC Connection',
        fn: async () => {
          const ipcCheck = await subcontainer.exec([
            'test',
            '-S',
            config.bitcoin_ipc_socket,
          ])

          if (ipcCheck.exitCode !== 0) {
            return {
              result: 'failure' as const,
              message: `Bitcoin Core IPC socket not available at ${config.bitcoin_ipc_socket}. Check that Bitcoin Core has IPC enabled (ipcbind setting).`,
            }
          }

          return {
            result: 'success' as const,
            message: 'Bitcoin Core IPC socket is available',
          }
        },
      },
      requires: ['primary'],
    })
  }

  return daemons
})

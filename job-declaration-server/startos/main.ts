import { configToml } from './fileModels/config.toml'
import { sdk } from './sdk'

export const main = sdk.setupMain(async ({ effects, started }) => {
  /**
   * ======================== Setup (optional) ========================
   *
   * In this section, we fetch any resources or run any desired preliminary commands.
   */
  console.info('Starting Pioneer Hash JD Server!')

  // Read and validate configuration
  const config = await configToml.read().const(effects)

  // Validate critical configuration fields before starting
  const defaultTestnetAddress = 'addr(tb1qa0sm0hxzj0x25rh8gw5xlzwlsfvvyz8u96w3p8)'

  if (!config || !config.coinbase_reward_script || config.coinbase_reward_script === defaultTestnetAddress) {
    throw new Error(
      'Configuration Required: You must configure a Bitcoin address for mining rewards. ' +
      'The default testnet address cannot be used. ' +
      'Please run the "Configure JD Server" action and enter your Bitcoin address where mining rewards should be sent.'
    )
  }

  /**
   * ======================== Daemons ========================
   *
   * In this section, we create one or more daemons that define the service runtime.
   *
   * Pioneer Hash JD Server coordinates job declaration between miners and pools.
   */
  return sdk.Daemons.of(effects, started).addDaemon('primary', {
    subcontainer: await sdk.SubContainer.of(
      effects,
      { imageId: 'sv2-jd-server' },
      sdk.Mounts.of().mountVolume({
        volumeId: 'main',
        subpath: null,
        mountpoint: '/data',
        readonly: false,
      }),
      'sv2-jd-server-sub',
    ),
    exec: {
      command: ['jd_server', '-c', '/data/config.toml']
    },
    ready: {
      display: 'Pioneer Hash JD Server Service',
      fn: () =>
        sdk.healthCheck.checkPortListening(effects, 34264, {
          successMessage: 'Pioneer Hash JD Server is accepting connections',
          errorMessage: 'Pioneer Hash JD Server is not ready',
        }),
    },
    requires: [],
  })
})

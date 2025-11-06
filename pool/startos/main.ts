import { configToml } from './fileModels/config.toml'
import { sdk } from './sdk'

export const main = sdk.setupMain(async ({ effects, started }) => {
  /**
   * ======================== Setup (optional) ========================
   *
   * In this section, we fetch any resources or run any desired preliminary commands.
   */
  console.info('Starting Pioneer Hash SV2 Pool!')

  // watch the config.toml for changes and restart
  // read(file => file.whatever) watches specific aspects of the file
  await configToml.read().const(effects)

  /**
   * ======================== Daemons ========================
   *
   * In this section, we create one or more daemons that define the service runtime.
   *
   * Pioneer Hash SV2 Pool provides a complete Stratum V2 pool server.
   */
  return sdk.Daemons.of(effects, started).addDaemon('primary', {
    subcontainer: await sdk.SubContainer.of(
      effects,
      { imageId: 'sv2-pool' },
      sdk.Mounts.of().mountVolume({
        volumeId: 'main',
        subpath: null,
        mountpoint: '/data',
        readonly: false,
      }),
      'sv2-pool-sub',
    ),
    exec: {
      command: ['pool_sv2', '-c', '/data/config.toml']
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
})

import { sv2TpConfFile } from './fileModels/sv2-tp.conf'
import { sdk } from './sdk'

export const main = sdk.setupMain(async ({ effects, started }) => {
  /**
   * ======================== Setup (optional) ========================
   *
   * In this section, we fetch any resources or run any desired preliminary commands.
   */
  console.info('Starting SV2 Template Provider!')

  // Read and watch the sv2-tp.conf for changes - will trigger restart if modified
  const conf = await sv2TpConfFile.read().const(effects)
  if (!conf) {
    throw new Error('sv2-tp.conf not found')
  }

  /**
   * ======================== Daemons ========================
   *
   * In this section, we create one or more daemons that define the service runtime.
   *
   * Template Provider connects to Bitcoin Core via IPC to generate and serve
   * block templates to SV2 pools using the Template Distribution Protocol.
   */
  return sdk.Daemons.of(effects, started).addDaemon('primary', {
    subcontainer: await sdk.SubContainer.of(
      effects,
      { imageId: 'sv2-template-provider' },
      sdk.Mounts.of().mountVolume({
        volumeId: 'main',
        subpath: null,
        mountpoint: '/data',
        readonly: false,
      }),
      'sv2-template-provider-sub',
    ),
    exec: {
      // sv2-tp reads the .conf file directly - SDK manages it
      // The .conf file is at /data/sv2-tp.conf (written by SDK)
      command: ['sv2-tp', '-conf=/data/sv2-tp.conf', '-datadir=/data'],
    },
    ready: {
      display: 'SV2 Template Provider Service',
      fn: () =>
        sdk.healthCheck.checkPortListening(effects, 8442, {
          successMessage:
            'Template Provider is serving block templates to pools',
          errorMessage: 'Template Provider is not ready',
        }),
    },
    requires: [],
  })
})

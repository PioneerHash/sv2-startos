import { sv2TpConfFile } from './fileModels/sv2-tp.conf'
import { sdk } from './sdk'
import { TEMPLATE_PROVIDER_PORT } from './utils'

export const main = sdk.setupMain(async ({ effects, started }) => {
  /**
   * ======================== Setup (optional) ========================
   *
   * In this section, we fetch any resources or run any desired preliminary commands.
   */
  console.info('Starting SV2 Template Provider!')

  // Create network-specific data directories (after volume is mounted)
  // sv2-tp uses subdirectories like Bitcoin Core (main, testnet4, signet, regtest)
  const subcontainer = await sdk.SubContainer.of(
    effects,
    { imageId: 'sv2-template-provider' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: null,
      mountpoint: '/data',
      readonly: false,
    }),
    'sv2-template-provider-init',
  )

  await subcontainer.exec(['mkdir', '-p', '/data/main', '/data/testnet4', '/data/signet', '/data/regtest'])
  await subcontainer.destroy()

  // Read and watch the sv2-tp.conf for changes - will trigger restart if modified
  const conf = await sv2TpConfFile.read().const(effects)
  if (!conf) {
    throw new Error('sv2-tp.conf not found')
  }

  // Read config to determine which Bitcoin service to depend on
  const chain = conf?.chain || 'main'
  const isTestnet4 = chain === 'testnet4'
  const bitcoindServiceId = isTestnet4 ? 'bitcoind-testnet4' : 'bitcoind'

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
      sdk.Mounts.of()
        .mountVolume({
          volumeId: 'main',
          subpath: null,
          mountpoint: '/data',
          readonly: false,
        })
        .mountDependency({
          dependencyId: bitcoindServiceId,
          volumeId: 'ipc',
          subpath: null,
          mountpoint: '/ipc',
          readonly: true,
        }),
      'sv2-template-provider-sub',
    ),
    exec: {
      // sv2-tp reads the .conf file directly - SDK manages it
      // The .conf file is at /data/sv2-tp.conf (written by SDK)
      // Use -debuglogfile=0 to disable file logging (StartOS captures stdout/stderr)
      command: [
        'sv2-tp',
        '-conf=/data/sv2-tp.conf',
        '-datadir=/data',
        '-debuglogfile=0',
        '-printtoconsole=1',
      ],
    },
    ready: {
      display: 'SV2 Template Provider Service',
      fn: () =>
        sdk.healthCheck.checkPortListening(effects, TEMPLATE_PROVIDER_PORT, {
          successMessage:
            'Template Provider is serving block templates to pools',
          errorMessage: 'Template Provider is not ready',
        }),
    },
    requires: [],
  })
})

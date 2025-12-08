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
  const rootDir = '/.sv2-tp'
  const initContainer = await sdk.SubContainer.of(
    effects,
    { imageId: 'sv2-template-provider' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: null,
      mountpoint: rootDir,
      readonly: false,
    }),
    'sv2-template-provider-init',
  )

  await initContainer.exec(['mkdir', '-p', `${rootDir}/main`, `${rootDir}/testnet4`, `${rootDir}/signet`, `${rootDir}/regtest`])
  await initContainer.destroy()

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
  const subcontainer = await sdk.SubContainer.of(
    effects,
    { imageId: 'sv2-template-provider' },
    sdk.Mounts.of()
      .mountVolume({
        volumeId: 'main',
        subpath: null,
        mountpoint: rootDir,
        readonly: false,
      })
      .mountDependency({
        dependencyId: bitcoindServiceId,
        volumeId: 'main',
        subpath: 'ipc',
        mountpoint: '/.bitcoin/ipc',
        readonly: true,
      }),
    'sv2-template-provider-sub',
  )

  // Validate IPC socket exists before starting
  console.info('Validating Bitcoin Core IPC socket availability...')
  const ipcSocketPath = conf.ipcconnect.replace('unix:', '')
  const ipcCheck = await subcontainer.exec(['test', '-S', ipcSocketPath])

  if (ipcCheck.exitCode !== 0) {
    await subcontainer.destroy()
    throw new Error(
      `Bitcoin Core IPC socket not found at ${ipcSocketPath}. ` +
        `Ensure Bitcoin Core (${bitcoindServiceId}) has IPC enabled in its configuration. ` +
        `The 'ipcbind' option must be set in Bitcoin Core settings.`,
    )
  }
  console.info('Bitcoin Core IPC socket validated successfully')

  const daemons = sdk.Daemons.of(effects, started).addDaemon('primary', {
    subcontainer,
    exec: {
      // sv2-tp reads the .conf file directly - SDK manages it
      // The .conf file is at /.sv2-tp/sv2-tp.conf (written by SDK)
      // Use -debuglogfile=0 to disable file logging (StartOS captures stdout/stderr)
      command: [
        'sv2-tp',
        `-conf=${rootDir}/sv2-tp.conf`,
        `-datadir=${rootDir}`,
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

  // Add continuous IPC health check
  daemons.addHealthCheck('ipc-validation', {
    ready: {
      display: 'Bitcoin Core IPC Connection',
      fn: async () => {
        const ipcCheck = await subcontainer.exec(['test', '-S', ipcSocketPath])

        if (ipcCheck.exitCode !== 0) {
          return {
            result: 'failure' as const,
            message: `Bitcoin Core IPC socket not available at ${ipcSocketPath}. Check that Bitcoin Core has IPC enabled (ipcbind setting).`,
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

  return daemons
})

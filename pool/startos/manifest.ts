import { setupManifest } from '@start9labs/start-sdk'
import { SDKImageInputSpec } from '@start9labs/start-sdk/base/lib/types/ManifestTypes'

const BUILD = process.env.BUILD || ''

const architectures =
  BUILD === 'x86_64' || BUILD === 'aarch64' ? [BUILD] : ['x86_64', 'aarch64']

export const manifest = setupManifest({
  id: 'sv2-pool',
  title: 'Pioneer Hash SV2 Pool',
  license: 'MIT OR Apache-2.0',
  wrapperRepo: 'https://github.com/PioneerHash/sv2-pool-startos',
  upstreamRepo: 'https://github.com/stratum-mining/sv2-apps',
  supportSite: 'https://stratumprotocol.org',
  marketingSite: 'https://stratumprotocol.org',
  donationUrl: 'https://opensats.org/projects/stratumv2',
  docsUrl:
    'https://github.com/stratum-mining/sv2-apps/blob/main/pool-apps/pool/README.md',
  description: {
    short: 'Pioneer Hash SV2 Pool Server',
    long: 'Pioneer Hash SV2 Pool provides a complete Stratum V2 (SV2) pool server for Bitcoin mining operations, communicating with downstream mining translators and proxies while connecting to a Template Provider for block templates.',
  },
  volumes: ['main'],
  images: {
    'sv2-pool': {
      source: {
        dockerBuild: {
          dockerfile: 'Dockerfile',
          workdir: '.',
        },
      },
      arch: architectures,
    } as SDKImageInputSpec,
  },
  hardwareRequirements: {
    arch: architectures,
  },
  alerts: {
    install:
      'IMPORTANT: Configure the Pool in the Config menu to select your template provider source (Local Template Provider, Remote Template Provider, or Bitcoin Core IPC) and set your mining reward address before starting.',
    update: null,
    uninstall: null,
    restore: null,
    start:
      'Starting Pool. Ensure your selected template provider is configured and running.',
    stop: null,
  },
  dependencies: {
    'sv2-template-provider': {
      description:
        'Local Template Provider for block template generation via SV2 protocol. Alternative to direct Bitcoin Core connection or remote Template Provider.',
      optional: true,
      s9pk: null,
    },
    bitcoind: {
      description:
        'Bitcoin Core (mainnet) for direct IPC connection. Alternative to Template Provider.',
      optional: true,
      s9pk: null,
    },
    'bitcoind-testnet4': {
      description:
        'Bitcoin Core (testnet4) for direct IPC connection. Alternative to Template Provider.',
      optional: true,
      s9pk: null,
    },
  },
})

import { setupManifest } from '@start9labs/start-sdk'
import { SDKImageInputSpec } from '@start9labs/start-sdk/base/lib/types/ManifestTypes'

const BUILD = process.env.BUILD || ''

const architectures =
  BUILD === 'x86_64' || BUILD === 'aarch64' ? [BUILD] : ['x86_64', 'aarch64']

export const manifest = setupManifest({
  id: 'sv2-template-provider',
  title: 'SV2 Template Provider',
  license: 'MIT',
  wrapperRepo: 'https://github.com/Start9Labs/sv2-startos',
  upstreamRepo: 'https://github.com/stratum-mining/sv2-tp',
  supportSite: 'https://stratumprotocol.org',
  marketingSite: 'https://stratumprotocol.org',
  donationUrl: 'https://opensats.org/projects/stratumv2',
  docsUrl: 'https://stratumprotocol.org/docs/',
  description: {
    short: 'SV2 Template Provider for Bitcoin mining',
    long: 'Template Provider connects to Bitcoin Core via IPC to generate and serve block templates to SV2 mining pools using the Template Distribution Protocol. It provides mining pools with up-to-date block templates for efficient mining operations.',
  },
  volumes: ['main'],
  images: {
    'sv2-template-provider': {
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
      'IMPORTANT: This service requires Bitcoin Core v30.0 or higher with IPC enabled. Please ensure you have Bitcoin Core installed and configured with IPC before starting this service. Configure your Template Provider settings in the Config menu.',
    update:
      'Template Provider has been updated. Review your configuration settings and ensure Bitcoin Core v30+ with IPC is running.',
    uninstall: null,
    restore:
      'Template Provider has been restored from backup. Verify your Bitcoin Core IPC connection is configured correctly.',
    start:
      'Starting Template Provider. Ensure Bitcoin Core v30+ with IPC is running.',
    stop: null,
  },
  dependencies: {
    bitcoind: {
      description: 'Bitcoin Core is required for mainnet template generation',
      optional: true,
      s9pk: null,
    },
    'bitcoind-testnet4': {
      description: 'Bitcoin Core Testnet4 is required for testnet4 template generation',
      optional: true,
      s9pk: null,
    },
  },
})

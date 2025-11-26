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
    install: null,
    update: null,
    uninstall: null,
    restore: null,
    start: null,
    stop: null,
  },
  dependencies: {},
})

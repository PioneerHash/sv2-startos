import { sdk } from './sdk'
import { TEMPLATE_PROVIDER_PORT } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  // SV2 Template Provider exposes a TCP interface for mining pools to connect
  // and receive block templates via the Template Distribution Protocol
  const templateProviderMulti = sdk.MultiHost.of(effects, 'template-provider-multi')
  const templateProviderOrigin = await templateProviderMulti.bindPort(
    TEMPLATE_PROVIDER_PORT,
    {
      protocol: null,
      addSsl: null,
      preferredExternalPort: TEMPLATE_PROVIDER_PORT,
      secure: { ssl: false },
    },
  )

  const templateProviderInterface = sdk.createInterface(effects, {
    name: 'SV2 Template Distribution',
    id: 'template-provider',
    description:
      'SV2 Template Distribution Protocol interface for mining pools to receive block templates',
    type: 'p2p',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  const templateProviderReceipt = await templateProviderOrigin.export([
    templateProviderInterface,
  ])

  return [templateProviderReceipt]
})

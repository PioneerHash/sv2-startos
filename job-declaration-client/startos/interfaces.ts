import { sdk } from './sdk'
import { DOWNSTREAM_PORT } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  // Pioneer Hash JD Client exposes a TCP interface for translators/proxies
  const downstreamMulti = sdk.MultiHost.of(effects, 'downstream-multi')
  const downstreamMultiOrigin = await downstreamMulti.bindPort(DOWNSTREAM_PORT, {
    protocol: null,
    addSsl: null,
    preferredExternalPort: DOWNSTREAM_PORT,
    secure: { ssl: false }
  })
  const downstreamInterface = sdk.createInterface(effects, {
    name: 'Pioneer Hash JD Client',
    id: 'jd-client',
    description: 'Job Declarator Client interface for connecting translators/proxies',
    type: 'api',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  const downstreamReceipt = await downstreamMultiOrigin.export([downstreamInterface])

  return [downstreamReceipt]
})

import { sdk } from './sdk'
import { DOWNSTREAM_PORT } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  // Pioneer Hash JD Server exposes a TCP interface for JD Clients
  const downstreamMulti = sdk.MultiHost.of(effects, 'downstream-multi')
  const downstreamMultiOrigin = await downstreamMulti.bindPort(DOWNSTREAM_PORT, {
    protocol: null,
    addSsl: null,
    preferredExternalPort: DOWNSTREAM_PORT,
    secure: { ssl: false }
  })
  const downstreamInterface = sdk.createInterface(effects, {
    name: 'Pioneer Hash JD Server',
    id: 'jd-server',
    description: 'Job Declarator interface for connecting JD Clients',
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

import { VersionGraph } from '@start9labs/start-sdk'
import { current, other } from './versions'
import { sv2TpConfFile, sv2TpConfDefaults } from '../fileModels/sv2-tp.conf'
import { sdk } from '../sdk'
import { setConfig } from '../actions/setConfig'

export const versionGraph = VersionGraph.of({
  current,
  other,
  preInstall: async (effects) => {
    // Write default sv2-tp.conf - SDK handles .conf format
    await sv2TpConfFile.write(effects, sv2TpConfDefaults)

    // Create critical task - needs to be done before start
    await sdk.action.createOwnTask(effects, setConfig, 'critical', {
      reason: 'Configure your Template Provider settings',
    })
  },
})

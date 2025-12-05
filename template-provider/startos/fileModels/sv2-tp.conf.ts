import { FileHelper, matches } from '@start9labs/start-sdk'

const { object, string, number, literal } = matches

// sv2-tp.conf defaults
export const sv2TpConfDefaults = {
  chain: 'main',
  ipcconnect: 'unix:/ipc/node.sock' as const,
  sv2interval: 30,
  sv2feedelta: 1000,
  loglevel: 'sv2:info',
}

// Schema for sv2-tp.conf file
export const shape = object({
  // Network chain (mainnet, testnet, signet, regtest)
  chain: string.onMismatch(sv2TpConfDefaults.chain),

  // IPC connection address - 'unix:<path>' for custom path
  // Default path '/ipc/node.sock' connects to Bitcoin Core IPC socket (mounted from dependency)
  ipcconnect: string.onMismatch(sv2TpConfDefaults.ipcconnect),

  // Template update interval in seconds
  sv2interval: number.onMismatch(sv2TpConfDefaults.sv2interval),

  // Fee delta in satoshis for template generation
  sv2feedelta: number.onMismatch(sv2TpConfDefaults.sv2feedelta),

  // Log level (e.g., 'sv2:trace', 'sv2:debug', 'sv2:info')
  loglevel: string.onMismatch(sv2TpConfDefaults.loglevel),
}).onMismatch(sv2TpConfDefaults)

// FileHelper.ini handles .conf files (key=value format) directly
export const sv2TpConfFile = FileHelper.ini(
  {
    volumeId: 'main',
    subpath: '/sv2-tp.conf',
  },
  shape,
  { bracketedArray: false },
)

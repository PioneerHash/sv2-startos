<p align="center">
  <img src="icon.png" alt="Project Logo" width="21%">
</p>

# SV2 Template Provider for StartOS

SV2 Template Provider is a StartOS service package that connects to Bitcoin Core via IPC to generate and serve block templates to SV2 mining pools using the Template Distribution Protocol.

## Setup

Follow the StartOS documentation [guides](https://docs.start9.com/packaging-guide/environment-setup.html) to set up your development environment.

The service uses the [sv2-tp](https://github.com/bitcoin/bitcoin) Template Provider implementation as a submodule.

## Building

```bash
make
```

## Configuration

SV2 Template Provider requires a Bitcoin Core node with IPC enabled. Configuration options include:

- **Testnet4 Mode**: Toggle to connect to Bitcoin Core Testnet4 instead of mainnet
- **Bitcoin Network**: Select the chain (mainnet, testnet, signet, regtest)
- **Template Update Interval**: How often to check for new templates (seconds)
- **Fee Delta**: Minimum fee difference to trigger a new template (satoshis)
- **Debug Categories**: Logging categories (e.g., "sv2,ipc")
- **Log Level**: Verbosity level (e.g., "sv2:debug")

## Dependencies

The Template Provider requires either:
- **Bitcoin Core** (bitcoind) for mainnet operation, or
- **Bitcoin Core Testnet4** (bitcoind-testnet4) for testnet4 operation

The dependency is automatically configured based on the Testnet4 Mode setting. The service binds to the Bitcoin Core IPC volume for high-performance communication.

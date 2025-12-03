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

### Required Bitcoin Core Version

**CRITICAL:** This service requires **Bitcoin Core v30.0 or higher** with **IPC (Inter-Process Communication) enabled**.

The Template Provider connects to Bitcoin Core via IPC socket to generate block templates. You must have one of the following installed:
- **Bitcoin Core v30+** (bitcoind) for mainnet operation, or
- **Bitcoin Core Testnet4 v30+** (bitcoind-testnet4) for testnet4 operation

### Bitcoin Core IPC Configuration

Bitcoin Core must be configured with IPC enabled. Verify your Bitcoin Core configuration includes:
- IPC socket enabled and accessible
- IPC socket path available at the mounted `/ipc` volume
- Sufficient permissions for socket communication

The service automatically selects the appropriate Bitcoin Core instance based on the **Testnet4 Mode** configuration setting.

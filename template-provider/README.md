<p align="center">
  <img src="icon.png" alt="Project Logo" width="21%">
</p>

# Pioneer Hash TProxy for StartOS

Pioneer Hash TProxy is a StartOS service package for the Stratum V2 (SV2) Translation Proxy, enabling SV1 mining device connectivity with SV2 pools.

## Setup

Follow the StartOS documentation [guides](https://docs.start9.com/packaging-guide/environment-setup.html) to set up your development environment.

The service uses the [sv2-apps](https://github.com/stratum-mining/sv2-apps) repository as a submodule for the Translator implementation.

## Building

```bash
make
```

## Configuration

Pioneer Hash TProxy requires configuration to connect to an upstream SV2 pool. Configuration options include:

- Upstream SV2 pool address and port
- Upstream pool authority public key
- Downstream listening address and port (default: 34255)
- Difficulty parameters for both upstream and downstream connections

See the [Translator documentation](https://github.com/stratum-mining/sv2-apps/blob/main/miner-apps/translator/README.md) for detailed configuration options.

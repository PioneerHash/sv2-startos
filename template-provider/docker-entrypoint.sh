#!/bin/bash
set -e

# SV2 Template Provider Entrypoint
# The sv2-tp.conf file is managed by StartOS SDK - no conversion needed

# Create network-specific data directories
# sv2-tp uses subdirectories like Bitcoin Core (main, testnet4, signet, regtest)
mkdir -p /data/main /data/testnet4 /data/signet /data/regtest

# Execute the command passed from StartOS
exec "$@"

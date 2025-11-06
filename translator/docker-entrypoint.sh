#!/bin/bash
set -e

CONFIG_FILE="${1:-/app/config/tproxy-config.toml}"

# If config file doesn't exist, show helpful message
if [ ! -f "$CONFIG_FILE" ]; then
  echo "=========================================="
  echo "SV2 Translator Proxy"
  echo "=========================================="
  echo ""
  echo "Error: Configuration file not found at: $CONFIG_FILE"
  echo ""
  echo "To run this container, you need to:"
  echo "1. Create a config file based on the examples in /app/config-examples/"
  echo "2. Mount it into the container:"
  echo ""
  echo "   docker run -v /path/to/your/config.toml:/app/config/tproxy-config.toml sv2-tproxy"
  echo ""
  echo "Or specify a custom config path:"
  echo ""
  echo "   docker run -v /path/to/your/config.toml:/app/my-config.toml sv2-tproxy -c /app/my-config.toml"
  echo ""
  echo "Example configs are available at /app/config-examples/"
  echo ""
  exit 1
fi

# Run translator with the config
exec translator_sv2 -c "$CONFIG_FILE"

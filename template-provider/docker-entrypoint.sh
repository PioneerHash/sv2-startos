#!/bin/bash
set -e

# SV2 Template Provider Entrypoint
# The sv2-tp.conf file is managed by StartOS SDK - no conversion needed
# Just execute the command passed from StartOS

exec "$@"

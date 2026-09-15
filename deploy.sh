#!/usr/bin/env bash
# Backward-compatible entry — same as gm-markets `./scripts/deploy.sh`.
set -euo pipefail
exec "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/scripts/deploy.sh" "$@"

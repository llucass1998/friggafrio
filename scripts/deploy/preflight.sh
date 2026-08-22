#!/bin/bash
set -Eeuo pipefail

# Keep the legacy path as a compatibility wrapper. The WSL guard is canonical.
exec "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/deploy/wsl-preflight.sh" "$@"

#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=wsl-guard-lib.sh
source "$SCRIPT_DIR/wsl-guard-lib.sh"

require_wsl
require_expected_paths
[[ "${1:-}" == "--apply" ]] || deploy_fail "BACKEND_SERVICE_INSTALL_REQUIRES_EXPLICIT_APPLY"

template="$SCRIPT_DIR/systemd/friggafrio-backend.service"
[[ -f "$template" ]] || deploy_fail "BACKEND_SERVICE_TEMPLATE_MISSING"
sudo install -o root -g root -m 0644 "$template" /etc/systemd/system/friggafrio-backend.service
sudo systemctl daemon-reload
echo "BACKEND_SERVICE_TEMPLATE=INSTALLED"

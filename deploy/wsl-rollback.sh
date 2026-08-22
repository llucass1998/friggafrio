#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=wsl-guard-lib.sh
source "$SCRIPT_DIR/wsl-guard-lib.sh"

require_wsl
require_expected_paths
for command_name in git pnpm systemctl; do require_command "$command_name"; done
[[ "${1:-}" == "--apply" ]] || deploy_fail "ROLLBACK_REQUIRES_EXPLICIT_APPLY"
[[ -n "${FRIGGAFRIO_ROLLBACK_SHA:-}" ]] || deploy_fail "ROLLBACK_SHA_REQUIRED"
git -C "$FRIGGAFRIO_DEPLOY_DIR" cat-file -e "${FRIGGAFRIO_ROLLBACK_SHA}^{commit}" || deploy_fail "ROLLBACK_SHA_UNKNOWN"
require_clean_git_dir "WSL_DEPLOY_CLONE" "$FRIGGAFRIO_DEPLOY_DIR"
acquire_deploy_lock
git -C "$FRIGGAFRIO_DEPLOY_DIR" checkout --detach "$FRIGGAFRIO_ROLLBACK_SHA"
pnpm --dir "$FRIGGAFRIO_DEPLOY_DIR" install --frozen-lockfile
pnpm --dir "$FRIGGAFRIO_DEPLOY_DIR" --filter backend build
pnpm --dir "$FRIGGAFRIO_DEPLOY_DIR" --filter storefront build
systemctl restart friggafrio-backend.service
systemctl restart friggafrio-storefront.service
echo "ROLLED_BACK_COMMIT_SHA=$(git -C "$FRIGGAFRIO_DEPLOY_DIR" rev-parse HEAD)"
exec "$SCRIPT_DIR/wsl-verify.sh"

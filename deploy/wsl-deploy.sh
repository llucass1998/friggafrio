#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=wsl-guard-lib.sh
source "$SCRIPT_DIR/wsl-guard-lib.sh"

require_wsl
require_expected_paths
for command_name in git node pnpm systemctl flock; do require_command "$command_name"; done
acquire_deploy_lock

if [[ "${1:-}" != "--apply" ]]; then
  FRIGGAFRIO_DEPLOY_LOCK_HELD=YES "$SCRIPT_DIR/wsl-preflight.sh"
  echo "DEPLOYMENT_PLAN=VALIDATED_ONLY"
  echo "DEPLOYMENT=DRY_RUN_REQUIRED_FOR_THIS_TASK"
  exit 0
fi

require_clean_git_dir "WSL_SOURCE" "$FRIGGAFRIO_SOURCE_DIR"
require_clean_git_dir "WSL_DEPLOY_CLONE" "$FRIGGAFRIO_DEPLOY_DIR"
[[ "$(git -C "$FRIGGAFRIO_SOURCE_DIR" branch --show-current)" == "$FRIGGAFRIO_BRANCH" ]] || deploy_fail "WSL_SOURCE_BRANCH_MISMATCH"

# The only allowed source synchronization: a fast-forward Git update from origin.
git -C "$FRIGGAFRIO_SOURCE_DIR" fetch origin "$FRIGGAFRIO_BRANCH"
git -C "$FRIGGAFRIO_SOURCE_DIR" pull --ff-only origin "$FRIGGAFRIO_BRANCH"
FRIGGAFRIO_DEPLOY_LOCK_HELD=YES "$SCRIPT_DIR/wsl-preflight.sh"

SOURCE_SHA="$(git -C "$FRIGGAFRIO_SOURCE_DIR" rev-parse HEAD)"
REMOTE_SHA="$(git -C "$FRIGGAFRIO_SOURCE_DIR" rev-parse "origin/$FRIGGAFRIO_BRANCH")"
APPROVED_SHA="${FRIGGAFRIO_APPROVED_SHA:-$REMOTE_SHA}"
[[ "$SOURCE_SHA" == "$APPROVED_SHA" ]] || deploy_fail "DEPLOY_BLOCKED_UNAPPROVED_SHA"
OLD_DEPLOY_SHA="$(git -C "$FRIGGAFRIO_DEPLOY_DIR" rev-parse HEAD)"

mkdir -p "$FRIGGAFRIO_BACKUP_ROOT"
BACKUP_DIR="$FRIGGAFRIO_BACKUP_ROOT/$(date -u +%Y%m%dT%H%M%SZ)-$SOURCE_SHA"
mkdir -p "$BACKUP_DIR"
umask 077
{
  echo "PREVIOUS_DEPLOY_SHA=$OLD_DEPLOY_SHA"
  echo "APPROVED_DEPLOY_SHA=$SOURCE_SHA"
  echo "REMOTE_SHA=$REMOTE_SHA"
  echo "ENV_SHA256=$(sha256sum "$FRIGGAFRIO_DEPLOY_DIR/.env" | awk '{print $1}')"
  echo "ROLLBACK_COMMAND=FRIGGAFRIO_ROLLBACK_SHA=$OLD_DEPLOY_SHA pnpm deploy:rollback -- --apply"
} > "$BACKUP_DIR/release-metadata.txt"

if git -C "$FRIGGAFRIO_DEPLOY_DIR" diff --name-only "$OLD_DEPLOY_SHA" "$SOURCE_SHA" -- apps/backend | grep -Eiq '(drop[[:space:]_]+(table|column)|truncate[[:space:]]+table|drop[[:space:]_]+index)'; then
  deploy_fail "DESTRUCTIVE_MIGRATION_BLOCKED"
fi

rollback() {
  echo "ROLLBACK_NEEDED=YES" >&2
  git -C "$FRIGGAFRIO_DEPLOY_DIR" checkout --detach "$OLD_DEPLOY_SHA"
  pnpm --dir "$FRIGGAFRIO_DEPLOY_DIR" install --frozen-lockfile
  pnpm --dir "$FRIGGAFRIO_DEPLOY_DIR" --filter backend build
  install_medusa_runtime_dependencies "$FRIGGAFRIO_DEPLOY_DIR"
  pnpm --dir "$FRIGGAFRIO_DEPLOY_DIR" --filter storefront build
  require_backend_service_runtime_contract
  systemctl restart friggafrio-backend.service
  systemctl restart friggafrio-storefront.service
}

git -C "$FRIGGAFRIO_DEPLOY_DIR" fetch origin "$FRIGGAFRIO_BRANCH"
git -C "$FRIGGAFRIO_DEPLOY_DIR" checkout --detach "$SOURCE_SHA"
pnpm --dir "$FRIGGAFRIO_DEPLOY_DIR" install --frozen-lockfile
pnpm --dir "$FRIGGAFRIO_DEPLOY_DIR" --filter backend build
install_medusa_runtime_dependencies "$FRIGGAFRIO_DEPLOY_DIR"
pnpm --dir "$FRIGGAFRIO_DEPLOY_DIR" --filter storefront build
require_backend_service_runtime_contract
systemctl restart friggafrio-backend.service
systemctl restart friggafrio-storefront.service

if ! FRIGGAFRIO_DEPLOY_LOCK_HELD=YES "$SCRIPT_DIR/wsl-verify.sh"; then
  rollback
  exit 1
fi

DEPLOYED_COMMIT_SHA="$(git -C "$FRIGGAFRIO_DEPLOY_DIR" rev-parse HEAD)"
[[ "$DEPLOYED_COMMIT_SHA" == "$SOURCE_SHA" ]] || { rollback; deploy_fail "DEPLOY_SHA_MISMATCH"; }
echo "DEPLOYED_COMMIT_SHA=$DEPLOYED_COMMIT_SHA"
echo "BACKUP_DIR=$BACKUP_DIR"
echo "ROLLBACK_AVAILABLE=YES"
echo "DEPLOYMENT=PASS"

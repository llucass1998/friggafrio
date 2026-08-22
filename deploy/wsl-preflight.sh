#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=wsl-guard-lib.sh
source "$SCRIPT_DIR/wsl-guard-lib.sh"

require_wsl
require_expected_paths
for command_name in git node pnpm systemctl curl docker; do require_command "$command_name"; done
if docker compose version >/dev/null 2>&1; then
  echo "DOCKER_COMPOSE=PLUGIN"
elif command -v docker-compose >/dev/null 2>&1 && docker-compose version >/dev/null 2>&1; then
  echo "DOCKER_COMPOSE=V1"
else
  deploy_fail "DEPLOY_BLOCKED_DOCKER_COMPOSE_UNAVAILABLE"
fi
require_clean_git_dir "WSL_SOURCE" "$FRIGGAFRIO_SOURCE_DIR"
require_clean_git_dir "WSL_DEPLOY_CLONE" "$FRIGGAFRIO_DEPLOY_DIR"
[[ "$(git -C "$FRIGGAFRIO_SOURCE_DIR" branch --show-current)" == "$FRIGGAFRIO_BRANCH" ]] || deploy_fail "WSL_SOURCE_BRANCH_MISMATCH"
git -C "$FRIGGAFRIO_SOURCE_DIR" fetch origin "$FRIGGAFRIO_BRANCH"
SOURCE_SHA="$(git -C "$FRIGGAFRIO_SOURCE_DIR" rev-parse HEAD)"
REMOTE_SHA="$(git -C "$FRIGGAFRIO_SOURCE_DIR" rev-parse "origin/$FRIGGAFRIO_BRANCH")"
[[ "$SOURCE_SHA" == "$REMOTE_SHA" ]] || deploy_fail "DEPLOY_BLOCKED_SOURCE_REMOTE_SHA_MISMATCH"
node "$FRIGGAFRIO_SOURCE_DIR/scripts/source-sync-policy-check.mjs" --deploy
require_required_env
require_no_recent_wsl_poweroff
systemctl is-active --quiet friggafrio-backend.service || deploy_fail "DEPLOY_BLOCKED_BACKEND_UNHEALTHY"
systemctl is-active --quiet friggafrio-storefront.service || deploy_fail "DEPLOY_BLOCKED_STOREFRONT_UNHEALTHY"
curl --fail --silent --show-error --max-time 20 http://127.0.0.1:9000/health >/dev/null || deploy_fail "DEPLOY_BLOCKED_BACKEND_HEALTHCHECK"
curl --fail --silent --show-error --max-time 20 http://127.0.0.1:5173/br >/dev/null || deploy_fail "DEPLOY_BLOCKED_STOREFRONT_HEALTHCHECK"
[[ -w "$FRIGGAFRIO_BACKUP_ROOT" || -w "$(dirname "$FRIGGAFRIO_BACKUP_ROOT")" ]] || deploy_fail "DEPLOY_BLOCKED_BACKUP_UNAVAILABLE"
if [[ "${FRIGGAFRIO_DEPLOY_LOCK_HELD:-NO}" != "YES" ]]; then
  acquire_deploy_lock
else
  echo "DEPLOY_LOCK=HELD_BY_CALLER"
fi
echo "SOURCE_SHA=$SOURCE_SHA"
echo "REMOTE_SHA=$REMOTE_SHA"
echo "PREVIOUS_DEPLOY_SHA=$(git -C "$FRIGGAFRIO_DEPLOY_DIR" rev-parse HEAD)"
echo "DEPLOY_PREFLIGHT=PASS"

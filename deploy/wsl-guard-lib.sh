#!/usr/bin/env bash
# Shared, fail-closed checks for the WSL-only release commands.

set -Eeuo pipefail

FRIGGAFRIO_BRANCH="Maestro"
FRIGGAFRIO_SOURCE_DIR="${FRIGGAFRIO_WSL_SOURCE:-/home/srv/friggafrio/Maestro}"
FRIGGAFRIO_DEPLOY_DIR="${FRIGGAFRIO_DEPLOY_TARGET:-/home/srv/friggafrio/Maestro-deploy}"
FRIGGAFRIO_LOCK_FILE="${FRIGGAFRIO_DEPLOY_LOCK:-/var/lock/friggafrio-deploy.lock}"
FRIGGAFRIO_BACKUP_ROOT="${FRIGGAFRIO_DEPLOY_BACKUP:-/var/backups/friggafrio}"
FRIGGAFRIO_PUBLIC_ORIGIN="${FRIGGAFRIO_PUBLIC_ORIGIN:-https://friggafrio.istigestao.com.br}"

deploy_fail() {
  echo "$1" >&2
  exit 1
}

require_wsl() {
  [[ "$(uname -s)" == "Linux" ]] || deploy_fail "DEPLOYMENT_PLATFORM_DENIED"
  [[ -f /proc/version ]] || deploy_fail "DEPLOYMENT_PLATFORM_DENIED"
  grep -Eiq 'microsoft|wsl' /proc/version || deploy_fail "DEPLOYMENT_PLATFORM_DENIED"
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || deploy_fail "DEPLOY_BLOCKED_MISSING_COMMAND=$1"
}

require_clean_git_dir() {
  local label="$1"
  local directory="$2"
  [[ -e "$directory/.git" ]] || deploy_fail "${label}_MISSING=$directory"
  [[ -z "$(git -C "$directory" status --porcelain --untracked-files=all)" ]] || deploy_fail "${label}_DIRTY"
}

require_expected_paths() {
  [[ "$(realpath "$FRIGGAFRIO_SOURCE_DIR")" == "/home/srv/friggafrio/Maestro" ]] || deploy_fail "WSL_SOURCE_PATH_MISMATCH"
  [[ "$(realpath "$FRIGGAFRIO_DEPLOY_DIR")" == "/home/srv/friggafrio/Maestro-deploy" ]] || deploy_fail "WSL_DEPLOY_PATH_MISMATCH"
}

require_no_recent_wsl_poweroff() {
  if journalctl --since '-10 minutes' --no-pager 2>/dev/null | grep -Eq 'InitTerminateInstanceInternal|reboot\(RB_POWER_OFF\)'; then
    deploy_fail "DEPLOY_BLOCKED_WSL_UNSTABLE=YES"
  fi
}

require_required_env() {
  local env_file="$FRIGGAFRIO_DEPLOY_DIR/.env"
  [[ -f "$env_file" ]] || deploy_fail "DEPLOY_BLOCKED_ENV_MISSING"
  local key
  for key in DATABASE_URL REDIS_URL JWT_SECRET COOKIE_SECRET; do
    grep -Eq "^${key}=.+" "$env_file" || deploy_fail "DEPLOY_BLOCKED_ENV_KEY_MISSING=$key"
  done
}

acquire_deploy_lock() {
  require_command flock
  mkdir -p "$(dirname "$FRIGGAFRIO_LOCK_FILE")"
  exec 9>"$FRIGGAFRIO_LOCK_FILE"
  flock -n 9 || deploy_fail "DEPLOY_ALREADY_RUNNING"
  echo "DEPLOY_LOCK=ACQUIRED"
}

read_publishable_key() {
  local env_file
  for env_file in "$FRIGGAFRIO_DEPLOY_DIR/.env" "$FRIGGAFRIO_DEPLOY_DIR/apps/storefront/.env"; do
    [[ -f "$env_file" ]] || continue
    local key
    key="$(awk -F= '/^VITE_MEDUSA_PUBLISHABLE_KEY=/{value=$2; sub(/^"/, "", value); sub(/"$/, "", value); print value; exit}' "$env_file")"
    if [[ -n "$key" ]]; then
      printf '%s' "$key"
      return 0
    fi
  done
  return 1
}

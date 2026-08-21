#!/usr/bin/env bash
set -Eeuo pipefail

# This is the only production entrypoint. It is intentionally fail-closed:
# source is synchronized by Git and production environment files stay local.

if [[ "$(uname -s)" != "Linux" || ! -f /proc/version || ! "$(< /proc/version)" =~ [Mm]icrosoft|[Ww][Ss][Ll] ]]; then
  echo "DEPLOYMENT_PLATFORM_DENIED: Production deployment is WSL-only." >&2
  exit 1
fi

LOCK_FILE="${FRIGGAFRIO_DEPLOY_LOCK:-/var/lock/friggafrio-deploy.lock}"
SOURCE_DIR="${FRIGGAFRIO_WSL_SOURCE:-/home/srv/friggafrio/Maestro}"
DEPLOY_DIR="${FRIGGAFRIO_DEPLOY_TARGET:-/home/srv/friggafrio/Maestro-deploy}"
BRANCH="Maestro"

mkdir -p "$(dirname "$LOCK_FILE")"
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "DEPLOY_ALREADY_RUNNING" >&2
  exit 1
fi

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

for command_name in git pnpm systemctl flock; do
  require_command "$command_name"
done

[[ -e "$SOURCE_DIR/.git" ]] || { echo "WSL_SOURCE_MISSING=$SOURCE_DIR" >&2; exit 1; }
[[ -e "$DEPLOY_DIR/.git" ]] || { echo "DEPLOY_TARGET_MISSING=$DEPLOY_DIR" >&2; exit 1; }

cd "$SOURCE_DIR"
[[ "$(git branch --show-current)" == "$BRANCH" ]] || { echo "WSL_SOURCE_BRANCH_MISMATCH" >&2; exit 1; }
[[ -z "$(git status --porcelain)" ]] || { echo "WSL_SOURCE_DIRTY" >&2; exit 1; }

git fetch origin "$BRANCH"
SOURCE_SHA="$(git rev-parse HEAD)"
REMOTE_SHA="$(git rev-parse "origin/$BRANCH")"
[[ "$SOURCE_SHA" == "$REMOTE_SHA" ]] || { echo "SOURCE_REMOTE_SHA_MISMATCH" >&2; exit 1; }

OLD_DEPLOY_SHA="$(git -C "$DEPLOY_DIR" rev-parse HEAD)"
[[ -z "$(git -C "$DEPLOY_DIR" diff --name-only -- ':!*.env' ':!**/.env*')" ]] || { echo "DEPLOY_SOURCE_DIFF_DETECTED" >&2; exit 1; }

echo "SOURCE_SHA=$SOURCE_SHA"
echo "REMOTE_SHA=$REMOTE_SHA"
echo "OLD_DEPLOY_SHA=$OLD_DEPLOY_SHA"
echo "ENV_PRESERVED=YES"

if [[ "${1:-}" != "--apply" ]]; then
  echo "DEPLOYMENT_PLAN=VALIDATED_ONLY"
  echo "SYSTEMD_RESTART=NO"
  echo "DEPLOYMENT=DRY_RUN_REQUIRED_FOR_THIS_TASK"
  exit 0
fi

BACKUP_ROOT="${FRIGGAFRIO_DEPLOY_BACKUP:-/var/backups/friggafrio}"
BACKUP_DIR="$BACKUP_ROOT/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP_DIR"
umask 077
{
  echo "OLD_DEPLOY_SHA=$OLD_DEPLOY_SHA"
  echo "SOURCE_SHA=$SOURCE_SHA"
  sha256sum "$DEPLOY_DIR"/.env 2>/dev/null || true
  systemctl is-enabled friggafrio-backend.service 2>/dev/null || true
  systemctl is-enabled friggafrio-storefront.service 2>/dev/null || true
} > "$BACKUP_DIR/release-metadata.txt"

if git -C "$DEPLOY_DIR" diff --name-only "$OLD_DEPLOY_SHA" "$SOURCE_SHA" -- apps/backend | grep -Eiq '(drop[[:space:]_]+(table|column)|truncate[[:space:]]+table|drop[[:space:]]+index)'; then
  echo "DESTRUCTIVE_MIGRATION_BLOCKED" >&2
  exit 1
fi

git -C "$DEPLOY_DIR" fetch origin "$BRANCH"
git -C "$DEPLOY_DIR" checkout --detach "$SOURCE_SHA"
pnpm --dir "$DEPLOY_DIR" install --frozen-lockfile
pnpm --dir "$DEPLOY_DIR" --filter backend build
pnpm --dir "$DEPLOY_DIR" --filter storefront build

systemctl restart friggafrio-backend.service
systemctl restart friggafrio-storefront.service

rollback() {
  echo "ROLLBACK_NEEDED=YES" >&2
  git -C "$DEPLOY_DIR" checkout --detach "$OLD_DEPLOY_SHA"
  pnpm --dir "$DEPLOY_DIR" install --frozen-lockfile
  pnpm --dir "$DEPLOY_DIR" --filter backend build
  pnpm --dir "$DEPLOY_DIR" --filter storefront build
  systemctl restart friggafrio-backend.service
  systemctl restart friggafrio-storefront.service
}

if ! systemctl is-active --quiet friggafrio-backend.service || ! systemctl is-active --quiet friggafrio-storefront.service; then
  rollback
  exit 1
fi

if ! command -v curl >/dev/null 2>&1 || ! curl --fail --silent --show-error --max-time 20 http://127.0.0.1:9000/health >/dev/null; then
  rollback
  exit 1
fi

DEPLOY_SHA="$(git -C "$DEPLOY_DIR" rev-parse HEAD)"
[[ "$SOURCE_SHA" == "$REMOTE_SHA" && "$REMOTE_SHA" == "$DEPLOY_SHA" ]] || { echo "DEPLOY_SHA_MISMATCH" >&2; rollback; exit 1; }
echo "DEPLOY_SHA=$DEPLOY_SHA"
echo "SYSTEMD_RESTART=YES"
echo "DEPLOYMENT=PASS"

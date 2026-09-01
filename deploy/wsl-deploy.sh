#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=wsl-guard-lib.sh
source "$SCRIPT_DIR/wsl-guard-lib.sh"

require_wsl
require_expected_paths
require_deploy_mode
for command_name in git node pnpm systemctl flock; do require_command "$command_name"; done
acquire_deploy_lock

apply="NO"
immutable="NO"
for argument in "$@"; do
  case "$argument" in
    --apply) apply="YES" ;;
    --immutable) immutable="YES" ;;
    *) deploy_fail "DEPLOYMENT_ARGUMENT_INVALID" ;;
  esac
done
if [[ "$immutable" == "YES" ]]; then
  FRIGGAFRIO_DEPLOY_MODE="IMMUTABLE_RELEASE_REPLACEMENT"
fi

if [[ "$apply" != "YES" ]]; then
  FRIGGAFRIO_DEPLOY_LOCK_HELD=YES FRIGGAFRIO_DEPLOY_MODE="$FRIGGAFRIO_DEPLOY_MODE" bash "$SCRIPT_DIR/wsl-preflight.sh"
  echo "DEPLOYMENT_PLAN=VALIDATED_ONLY"
  echo "DEPLOYMENT=DRY_RUN_REQUIRED_FOR_THIS_TASK"
  exit 0
fi

if [[ "$FRIGGAFRIO_DEPLOY_MODE" == "IMMUTABLE_RELEASE_REPLACEMENT" ]]; then
  require_command pg_dump
  require_command pg_restore
  require_clean_git_dir "WSL_SOURCE" "$FRIGGAFRIO_SOURCE_DIR"
  [[ "$(git -C "$FRIGGAFRIO_SOURCE_DIR" branch --show-current)" == "$FRIGGAFRIO_BRANCH" ]] || deploy_fail "WSL_SOURCE_BRANCH_MISMATCH"
  git -C "$FRIGGAFRIO_SOURCE_DIR" fetch origin "$FRIGGAFRIO_BRANCH"
  git -C "$FRIGGAFRIO_SOURCE_DIR" pull --ff-only origin "$FRIGGAFRIO_BRANCH"
  SOURCE_SHA="$(git -C "$FRIGGAFRIO_SOURCE_DIR" rev-parse HEAD)"
  REMOTE_SHA="$(git -C "$FRIGGAFRIO_SOURCE_DIR" rev-parse "origin/$FRIGGAFRIO_BRANCH")"
  REMOTE_LS_SHA="$(git ls-remote "$(git -C "$FRIGGAFRIO_SOURCE_DIR" remote get-url origin)" "refs/heads/$FRIGGAFRIO_BRANCH" | awk '{print $1}')"
  APPROVED_SHA="${FRIGGAFRIO_APPROVED_SHA:-$REMOTE_SHA}"
  [[ "$SOURCE_SHA" == "$REMOTE_SHA" && "$REMOTE_SHA" == "$REMOTE_LS_SHA" && "$SOURCE_SHA" == "$APPROVED_SHA" ]] || deploy_fail "IMMUTABLE_REMOTE_SHA_MISMATCH"
  mkdir -p "$FRIGGAFRIO_RELEASE_ROOT" "$FRIGGAFRIO_BACKUP_ROOT"
  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  candidate_dir="$FRIGGAFRIO_RELEASE_ROOT/$SOURCE_SHA-$timestamp"
  [[ ! -e "$candidate_dir" ]] || deploy_fail "IMMUTABLE_CANDIDATE_PATH_EXISTS"
  git clone --branch "$FRIGGAFRIO_BRANCH" --single-branch "$(git -C "$FRIGGAFRIO_SOURCE_DIR" remote get-url origin)" "$candidate_dir"
  git -C "$candidate_dir" checkout --detach "$SOURCE_SHA"
  require_release_candidate "$candidate_dir" "$SOURCE_SHA"
  copy_runtime_file_if_untracked "$FRIGGAFRIO_DEPLOY_DIR" "$candidate_dir" "apps/backend/.env"
  copy_runtime_file_if_untracked "$FRIGGAFRIO_DEPLOY_DIR" "$candidate_dir" ".env"
  copy_runtime_file_if_untracked "$FRIGGAFRIO_DEPLOY_DIR" "$candidate_dir" "apps/storefront/.env"
  copy_runtime_file_if_untracked "$FRIGGAFRIO_DEPLOY_DIR" "$candidate_dir" "apps/storefront/.env.local"
  require_file_provider_env "$candidate_dir"
  require_storefront_build_env "$candidate_dir"
  pnpm --dir "$candidate_dir" install --frozen-lockfile
  pnpm --dir "$candidate_dir" --filter backend build
  install_medusa_runtime_dependencies "$candidate_dir"
  pnpm --dir "$candidate_dir" --filter storefront build
  printf '%s\n' "$SOURCE_SHA" > "$candidate_dir/apps/backend/.medusa/server/.friggafrio-release-sha"
  verify_medusa_runtime_contract "$candidate_dir" --require-runtime-dependencies
  # Root-run WSL automation must leave the immutable runtime readable by srv.
  if [[ "$(id -u)" == "0" ]]; then
    chown -R --reference="$FRIGGAFRIO_DEPLOY_DIR" "$candidate_dir"
  fi
  backup_dir="$FRIGGAFRIO_BACKUP_ROOT/$timestamp-$SOURCE_SHA"
  [[ ! -e "$backup_dir" ]] || deploy_fail "IMMUTABLE_BACKUP_PATH_EXISTS"
  mkdir -p "$backup_dir"
  legacy_manifest="$backup_dir/legacy-manifest.txt"
  old_unit_backup="$backup_dir/friggafrio-backend.service.before"
  write_legacy_manifest "$FRIGGAFRIO_DEPLOY_DIR" "$legacy_manifest"
  systemctl cat friggafrio-backend.service > "$old_unit_backup"
  old_unit_checksum="$(sha256sum "$old_unit_backup" | awk '{print $1}')"
  database_url="$(awk -F= '/^DATABASE_URL=/{sub(/^DATABASE_URL=/, ""); sub(/\r$/, ""); print; exit}' "$FRIGGAFRIO_DEPLOY_DIR/apps/backend/.env")"
  [[ -n "$database_url" ]] || deploy_fail "DATABASE_BACKUP_URL_MISSING"
  database_backup="$backup_dir/postgresql-before-$SOURCE_SHA.dump"
  pg_dump --format=custom --file="$database_backup" "$database_url"
  pg_restore --list "$database_backup" >/dev/null
  database_checksum="$(sha256sum "$database_backup" | awk '{print $1}')"
  FRIGGAFRIO_IMMUTABLE_CANDIDATE="$candidate_dir" FRIGGAFRIO_LEGACY_MANIFEST="$legacy_manifest" FRIGGAFRIO_OLD_UNIT_BACKUP="$old_unit_backup" FRIGGAFRIO_APPROVED_SHA="$SOURCE_SHA" FRIGGAFRIO_DEPLOY_MODE="IMMUTABLE_RELEASE_REPLACEMENT" FRIGGAFRIO_DEPLOY_LOCK_HELD=YES bash "$SCRIPT_DIR/wsl-preflight.sh"
  old_backend_pid="$(systemctl show --property=MainPID --value friggafrio-backend.service)"
  bash "$SCRIPT_DIR/wsl-install-backend-service.sh" --apply
  [[ "$(systemctl show --property=MainPID --value friggafrio-backend.service)" == "$old_backend_pid" ]] || { cp "$old_unit_backup" /tmp/friggafrio-backend.service.rollback; sudo install -o root -g root -m 0644 /tmp/friggafrio-backend.service.rollback /etc/systemd/system/friggafrio-backend.service; sudo systemctl daemon-reload; deploy_fail "IMMUTABLE_UNEXPECTED_SERVICE_RESTART"; }
  legacy_dir="/home/srv/friggafrio/Maestro-deploy-legacy-preserved-$timestamp"
  [[ ! -e "$legacy_dir" ]] || deploy_fail "LEGACY_PRESERVATION_PATH_EXISTS"
  systemctl stop friggafrio-storefront.service
  systemctl stop friggafrio-backend.service
  mv "$FRIGGAFRIO_DEPLOY_DIR" "$legacy_dir"
  if ! mv "$candidate_dir" "$FRIGGAFRIO_DEPLOY_DIR"; then
    mv "$legacy_dir" "$FRIGGAFRIO_DEPLOY_DIR"
    sudo install -o root -g root -m 0644 "$old_unit_backup" /etc/systemd/system/friggafrio-backend.service
    sudo systemctl daemon-reload
    systemctl start friggafrio-backend.service
    systemctl start friggafrio-storefront.service
    deploy_fail "IMMUTABLE_RELEASE_SWAP_FAILED_ROLLED_BACK"
  fi
  verify_medusa_runtime_contract "$FRIGGAFRIO_DEPLOY_DIR" --require-runtime-dependencies
  systemctl restart friggafrio-backend.service
  systemctl restart friggafrio-storefront.service
  if ! FRIGGAFRIO_DEPLOY_LOCK_HELD=YES bash "$SCRIPT_DIR/wsl-verify.sh"; then
    systemctl stop friggafrio-storefront.service
    systemctl stop friggafrio-backend.service
    failed_dir="/home/srv/friggafrio/Maestro-deploy-failed-$timestamp"
    mv "$FRIGGAFRIO_DEPLOY_DIR" "$failed_dir"
    mv "$legacy_dir" "$FRIGGAFRIO_DEPLOY_DIR"
    sudo install -o root -g root -m 0644 "$old_unit_backup" /etc/systemd/system/friggafrio-backend.service
    sudo systemctl daemon-reload
    systemctl start friggafrio-backend.service
    systemctl start friggafrio-storefront.service
    deploy_fail "IMMUTABLE_RELEASE_VERIFY_FAILED_ROLLED_BACK"
  fi
  echo "LEGACY_DEPLOY_DIRTY_PRESERVED=YES"
  echo "LEGACY_PRESERVATION_PATH=$legacy_dir"
  echo "CANDIDATE_PATH=$FRIGGAFRIO_DEPLOY_DIR"
  echo "DATABASE_BACKUP=$database_backup"
  echo "DATABASE_BACKUP_CHECKSUM=$database_checksum"
  echo "OLD_UNIT_BACKUP=$old_unit_backup"
  echo "OLD_UNIT_CHECKSUM=$old_unit_checksum"
  echo "DEPLOYED_COMMIT_SHA=$(git -C "$FRIGGAFRIO_DEPLOY_DIR" rev-parse HEAD)"
  echo "DEPLOYMENT=PASS"
  exit 0
fi

require_clean_git_dir "WSL_SOURCE" "$FRIGGAFRIO_SOURCE_DIR"
require_clean_git_dir "WSL_DEPLOY_CLONE" "$FRIGGAFRIO_DEPLOY_DIR"
[[ "$(git -C "$FRIGGAFRIO_SOURCE_DIR" branch --show-current)" == "$FRIGGAFRIO_BRANCH" ]] || deploy_fail "WSL_SOURCE_BRANCH_MISMATCH"

# The only allowed source synchronization: a fast-forward Git update from origin.
git -C "$FRIGGAFRIO_SOURCE_DIR" fetch origin "$FRIGGAFRIO_BRANCH"
git -C "$FRIGGAFRIO_SOURCE_DIR" pull --ff-only origin "$FRIGGAFRIO_BRANCH"
FRIGGAFRIO_DEPLOY_LOCK_HELD=YES bash "$SCRIPT_DIR/wsl-preflight.sh"

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
require_file_provider_env "$FRIGGAFRIO_DEPLOY_DIR"
require_storefront_build_env "$FRIGGAFRIO_DEPLOY_DIR"
pnpm --dir "$FRIGGAFRIO_DEPLOY_DIR" install --frozen-lockfile
pnpm --dir "$FRIGGAFRIO_DEPLOY_DIR" --filter backend build
install_medusa_runtime_dependencies "$FRIGGAFRIO_DEPLOY_DIR"
pnpm --dir "$FRIGGAFRIO_DEPLOY_DIR" --filter storefront build
printf '%s\n' "$SOURCE_SHA" > "$FRIGGAFRIO_DEPLOY_DIR/apps/backend/.medusa/server/.friggafrio-release-sha"
require_backend_service_runtime_contract
systemctl restart friggafrio-backend.service
systemctl restart friggafrio-storefront.service

if ! FRIGGAFRIO_DEPLOY_LOCK_HELD=YES bash "$SCRIPT_DIR/wsl-verify.sh"; then
  rollback
  exit 1
fi

DEPLOYED_COMMIT_SHA="$(git -C "$FRIGGAFRIO_DEPLOY_DIR" rev-parse HEAD)"
[[ "$DEPLOYED_COMMIT_SHA" == "$SOURCE_SHA" ]] || { rollback; deploy_fail "DEPLOY_SHA_MISMATCH"; }
echo "DEPLOYED_COMMIT_SHA=$DEPLOYED_COMMIT_SHA"
echo "BACKUP_DIR=$BACKUP_DIR"
echo "ROLLBACK_AVAILABLE=YES"
echo "DEPLOYMENT=PASS"

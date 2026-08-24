#!/usr/bin/env bash
# Shared, fail-closed checks for the WSL-only release commands.

set -Eeuo pipefail

FRIGGAFRIO_BRANCH="Maestro"
FRIGGAFRIO_SOURCE_DIR="${FRIGGAFRIO_WSL_SOURCE:-/home/srv/friggafrio/Maestro}"
FRIGGAFRIO_DEPLOY_DIR="${FRIGGAFRIO_DEPLOY_TARGET:-/home/srv/friggafrio/Maestro-deploy}"
FRIGGAFRIO_LOCK_FILE="${FRIGGAFRIO_DEPLOY_LOCK:-/var/lock/friggafrio-deploy.lock}"
FRIGGAFRIO_BACKUP_ROOT="${FRIGGAFRIO_DEPLOY_BACKUP:-/var/backups/friggafrio}"
FRIGGAFRIO_PUBLIC_ORIGIN="${FRIGGAFRIO_PUBLIC_ORIGIN:-https://friggafrio.istigestao.com.br}"
FRIGGAFRIO_RELEASE_ROOT="${FRIGGAFRIO_RELEASE_ROOT:-/home/srv/friggafrio/releases}"
FRIGGAFRIO_DEPLOY_MODE="${FRIGGAFRIO_DEPLOY_MODE:-IN_PLACE_SYNC}"
FRIGGAFRIO_OFFICIAL_ORIGIN="https://github.com/llucass1998/friggafrio.git"

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

require_deploy_mode() {
  [[ "$FRIGGAFRIO_DEPLOY_MODE" == "IN_PLACE_SYNC" || "$FRIGGAFRIO_DEPLOY_MODE" == "IMMUTABLE_RELEASE_REPLACEMENT" ]] || deploy_fail "DEPLOY_MODE_INVALID"
}

require_official_origin() {
  local directory="$1"
  [[ "$(git -C "$directory" remote get-url origin)" == "$FRIGGAFRIO_OFFICIAL_ORIGIN" ]] || deploy_fail "RELEASE_ORIGIN_INVALID"
}

require_release_candidate() {
  local candidate_dir="$1"
  local approved_sha="$2"
  local require_clean="${3:-YES}"
  [[ -n "$candidate_dir" ]] || deploy_fail "IMMUTABLE_CANDIDATE_REQUIRED"
  [[ -d "$candidate_dir/.git" ]] || deploy_fail "IMMUTABLE_CANDIDATE_MISSING"
  [[ ! -L "$candidate_dir" ]] || deploy_fail "IMMUTABLE_CANDIDATE_SYMLINK"
  [[ "$(realpath "$candidate_dir")" == "$(realpath "$FRIGGAFRIO_RELEASE_ROOT")"/* ]] || deploy_fail "IMMUTABLE_CANDIDATE_OUTSIDE_RELEASE_ROOT"
  [[ "$(realpath "$candidate_dir")" != "$(realpath "$FRIGGAFRIO_DEPLOY_DIR")" ]] || deploy_fail "IMMUTABLE_CANDIDATE_IS_DEPLOY_DIR"
  require_official_origin "$candidate_dir"
  [[ "$require_clean" == "YES" || "$require_clean" == "NO" ]] || deploy_fail "IMMUTABLE_CANDIDATE_CLEAN_STATE_INVALID"
  if [[ "$require_clean" == "YES" ]]; then
    require_clean_git_dir "IMMUTABLE_CANDIDATE" "$candidate_dir"
  fi
  [[ "$(git -C "$candidate_dir" rev-parse HEAD)" == "$approved_sha" ]] || deploy_fail "IMMUTABLE_CANDIDATE_SHA_MISMATCH"
  git -C "$candidate_dir" ls-files | grep -Eq '(^|/)\.env$' && deploy_fail "IMMUTABLE_CANDIDATE_TRACKED_ENV" || true
}

write_legacy_manifest() {
  local legacy_dir="$1"
  local manifest="$2"
  [[ -d "$legacy_dir/.git" ]] || deploy_fail "LEGACY_DEPLOY_MISSING"
  [[ ! -e "$manifest" ]] || deploy_fail "LEGACY_MANIFEST_EXISTS"
  umask 077
  {
    echo "LEGACY_PATH=$legacy_dir"
    echo "LEGACY_HEAD=$(git -C "$legacy_dir" rev-parse HEAD)"
    echo "LEGACY_BRANCH=$(git -C "$legacy_dir" branch --show-current || true)"
    echo "LEGACY_ORIGIN=$(git -C "$legacy_dir" remote get-url origin || true)"
    echo "TRACKED_MODIFIED_PATHS_BEGIN"
    git -C "$legacy_dir" diff --name-only
    echo "TRACKED_MODIFIED_PATHS_END"
    echo "UNTRACKED_PATHS_BEGIN"
    git -C "$legacy_dir" ls-files --others --exclude-standard
    echo "UNTRACKED_PATHS_END"
    echo "UNTRACKED_COUNT=$(git -C "$legacy_dir" ls-files --others --exclude-standard | wc -l)"
    echo "CONTENT_SHA256_BEGIN"
    (cd "$legacy_dir" && find . -type f -print0 | sort -z | xargs -0 -r sha256sum)
    echo "CONTENT_SHA256_END"
  } > "$manifest"
}

copy_runtime_file_if_untracked() {
  local legacy_dir="$1"
  local candidate_dir="$2"
  local relative_path="$3"
  local source="$legacy_dir/$relative_path"
  local destination="$candidate_dir/$relative_path"
  [[ -f "$source" ]] || return 0
  git -C "$legacy_dir" ls-files --error-unmatch -- "$relative_path" >/dev/null 2>&1 && deploy_fail "LEGACY_RUNTIME_FILE_TRACKED=$relative_path"
  install -D -m "$(stat -c '%a' "$source")" "$source" "$destination"
  chown --reference="$source" "$destination"
  [[ "$(sha256sum "$source" | awk '{print $1}')" == "$(sha256sum "$destination" | awk '{print $1}')" ]] || deploy_fail "RUNTIME_CONFIG_COPY_CHECKSUM_MISMATCH"
}

require_no_recent_wsl_poweroff() {
  if journalctl --since '-10 minutes' --no-pager 2>/dev/null | grep -Eq 'InitTerminateInstanceInternal|reboot\(RB_POWER_OFF\)'; then
    deploy_fail "DEPLOY_BLOCKED_WSL_UNSTABLE=YES"
  fi
}

require_required_env() {
  local env_file="$FRIGGAFRIO_DEPLOY_DIR/apps/backend/.env"
  [[ -f "$env_file" ]] || deploy_fail "DEPLOY_BLOCKED_ENV_MISSING"
  local key
  for key in DATABASE_URL REDIS_URL JWT_SECRET COOKIE_SECRET; do
    grep -Eq "^${key}=.+" "$env_file" || deploy_fail "DEPLOY_BLOCKED_ENV_KEY_MISSING=$key"
  done
}

medusa_runtime_dir() {
  printf '%s/apps/backend/.medusa/server' "$1"
}

require_self_contained_node_modules() {
  local node_modules_dir="$1"
  local link
  local target
  while IFS= read -r -d '' link; do
    target="$(realpath "$link")"
    [[ "$target" == "$node_modules_dir"/* ]] || deploy_fail "MEDUSA_RUNTIME_EXTERNAL_SYMLINK"
  done < <(find "$node_modules_dir" -type l -print0)
}

verify_medusa_runtime_contract() {
  local release_dir="$1"
  shift
  node "$release_dir/scripts/deploy/medusa-runtime-contract.mjs" \
    --release-dir "$release_dir" \
    --runtime-dir "$(medusa_runtime_dir "$release_dir")" \
    "$@"
}

install_medusa_runtime_dependencies() {
  local release_dir="$1"
  local runtime_dir
  local dependency_stage
  runtime_dir="$(medusa_runtime_dir "$release_dir")"
  dependency_stage="$release_dir/apps/backend/.medusa/runtime-dependencies"
  verify_medusa_runtime_contract "$release_dir"
  [[ ! -e "$dependency_stage" ]] || deploy_fail "MEDUSA_RUNTIME_DEPENDENCY_STAGE_EXISTS"
  [[ ! -e "$runtime_dir/node_modules" ]] || deploy_fail "MEDUSA_RUNTIME_DEPENDENCIES_STALE"
  # Build output has no lockfile. pnpm deploy uses the already frozen workspace
  # lockfile, then places exactly those production dependencies in the runtime.
  # pnpm 10 requires an explicit legacy deploy for non-injected workspaces.
  if ! pnpm --dir "$release_dir" --filter backend --prod deploy --legacy "$dependency_stage"; then
    # This path was verified absent before pnpm created it for this invocation.
    rm -rf -- "$dependency_stage"
    deploy_fail "MEDUSA_RUNTIME_DEPENDENCY_INSTALL_FAILED"
  fi
  [[ -d "$dependency_stage/node_modules" ]] || deploy_fail "MEDUSA_RUNTIME_DEPENDENCY_STAGE_MISSING"
  # pnpm legacy deploy writes this workspace self-link even though the runtime
  # never loads its package manifest. It would tie a release to its build tree.
  rm -f -- "$dependency_stage/node_modules/.pnpm/node_modules/backend"
  require_self_contained_node_modules "$dependency_stage/node_modules"
  mv "$dependency_stage/node_modules" "$runtime_dir/node_modules"
  verify_medusa_runtime_contract "$release_dir" --require-runtime-dependencies
}

require_backend_service_runtime_contract() {
  local expected_runtime
  expected_runtime="$(medusa_runtime_dir "$FRIGGAFRIO_DEPLOY_DIR")"
  local working_directory
  working_directory="$(systemctl show --property=WorkingDirectory --value friggafrio-backend.service)"
  [[ "$working_directory" == "$expected_runtime" ]] || deploy_fail "BACKEND_SERVICE_RUNTIME_DIRECTORY_MISMATCH"
  local exec_start
  exec_start="$(systemctl show --property=ExecStart --value friggafrio-backend.service)"
  [[ "$exec_start" == *"medusa start"* && "$exec_start" != *"--filter backend"* ]] || deploy_fail "BACKEND_SERVICE_RUNTIME_COMMAND_MISMATCH"
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

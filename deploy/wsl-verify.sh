#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=wsl-guard-lib.sh
source "$SCRIPT_DIR/wsl-guard-lib.sh"

require_wsl
require_expected_paths
for command_name in git curl systemctl; do require_command "$command_name"; done

FRIGGAFRIO_READINESS_TIMEOUT_SECONDS="${FRIGGAFRIO_READINESS_TIMEOUT_SECONDS:-60}"
FRIGGAFRIO_READINESS_INTERVAL_SECONDS="${FRIGGAFRIO_READINESS_INTERVAL_SECONDS:-1}"
FRIGGAFRIO_READINESS_REQUIRED_200="${FRIGGAFRIO_READINESS_REQUIRED_200:-3}"

monotonic_seconds() {
  awk '{print $1}' /proc/uptime
}

readiness_diagnostics() {
  echo "BACKEND_READINESS_DIAGNOSTICS=BEGIN" >&2
  systemctl show friggafrio-backend.service --property=ActiveState,SubState,MainPID,NRestarts --no-pager >&2 || true
  journalctl -u friggafrio-backend.service -n 40 --no-pager 2>/dev/null \
    | sed -E 's/((SECRET|TOKEN|PASSWORD|API_KEY|DATABASE_URL)[^=[:space:]]*[=:])[[:space:]]*[^[:space:]]+/\1[REDACTED]/Ig' >&2 || true
  echo "BACKEND_READINESS_DIAGNOSTICS=END" >&2
}

wait_for_backend_readiness() {
  local started now elapsed state pid previous_pid="" pid_changes=0 consecutive=0 attempts=0 status_code
  started="$(monotonic_seconds)"
  while true; do
    state="$(systemctl show --property=ActiveState --value friggafrio-backend.service)"
    pid="$(systemctl show --property=MainPID --value friggafrio-backend.service)"
    [[ "$state" != "failed" && "$state" != "inactive" ]] || { readiness_diagnostics; deploy_fail "VERIFY_BACKEND_SERVICE_$state"; }
    if [[ -n "$previous_pid" && "$pid" != "0" && "$pid" != "$previous_pid" ]]; then
      pid_changes=$((pid_changes + 1))
      [[ "$pid_changes" -lt 2 ]] || { readiness_diagnostics; deploy_fail "VERIFY_BACKEND_RESTART_LOOP"; }
    fi
    [[ "$pid" == "0" ]] || previous_pid="$pid"
    status_code="$(curl --silent --output /dev/null --write-out '%{http_code}' --max-time 5 http://127.0.0.1:9000/health || true)"
    attempts=$((attempts + 1))
    if [[ "$status_code" == "200" ]]; then
      consecutive=$((consecutive + 1))
      if [[ "$consecutive" -ge "$FRIGGAFRIO_READINESS_REQUIRED_200" ]]; then
        now="$(monotonic_seconds)"
        elapsed="$(awk -v now="$now" -v started="$started" 'BEGIN { printf "%.3f", now - started }')"
        echo "BACKEND_READY_AFTER_SECONDS=$elapsed"
        echo "BACKEND_READINESS_ATTEMPTS=$attempts"
        echo "BACKEND_PID_STABLE=YES"
        return 0
      fi
    elif [[ "$status_code" == "000" ]]; then
      consecutive=0
    else
      readiness_diagnostics
      deploy_fail "VERIFY_BACKEND_HEALTH_HTTP_$status_code"
    fi
    now="$(monotonic_seconds)"
    if awk -v now="$now" -v started="$started" -v timeout="$FRIGGAFRIO_READINESS_TIMEOUT_SECONDS" 'BEGIN { exit !(now - started >= timeout) }'; then
      readiness_diagnostics
      deploy_fail "VERIFY_BACKEND_READINESS_TIMEOUT"
    fi
    sleep "$FRIGGAFRIO_READINESS_INTERVAL_SECONDS"
  done
}

main() {
  require_no_recent_wsl_poweroff
  DEPLOYED_COMMIT_SHA="$(git -C "$FRIGGAFRIO_DEPLOY_DIR" rev-parse HEAD)"
  verify_medusa_runtime_contract "$FRIGGAFRIO_DEPLOY_DIR" --require-runtime-dependencies
  require_backend_service_runtime_contract
  systemctl is-active --quiet friggafrio-storefront.service || deploy_fail "VERIFY_STOREFRONT_SERVICE_FAILED"
  wait_for_backend_readiness
  PUBLISHABLE_KEY="$(read_publishable_key)" || deploy_fail "VERIFY_PUBLISHABLE_KEY_UNAVAILABLE"
  curl --fail --silent --show-error --max-time 20 -H "x-publishable-api-key: $PUBLISHABLE_KEY" 'http://127.0.0.1:9000/store/products?limit=1' >/dev/null || deploy_fail "VERIFY_STORE_API_FAILED"
  curl --fail --silent --show-error --max-time 20 http://127.0.0.1:5173/br >/dev/null || deploy_fail "VERIFY_STOREFRONT_FAILED"
  curl --fail --silent --show-error --max-time 20 http://127.0.0.1:9000/app >/dev/null || deploy_fail "VERIFY_ADMIN_APP_FAILED"
  curl --fail --silent --show-error --max-time 30 "$FRIGGAFRIO_PUBLIC_ORIGIN/" >/dev/null || deploy_fail "VERIFY_PUBLIC_URL_FAILED"
  echo "DEPLOYED_COMMIT_SHA=$DEPLOYED_COMMIT_SHA"
  echo "VERIFY_STABILITY_WINDOW_SECONDS=300"
  echo "DEPLOY_VERIFY=PASS"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi

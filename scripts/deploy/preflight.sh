#!/bin/bash
set -Eeuo pipefail

echo "Executing preflight checks..."
docker info >/dev/null 2>&1 || { echo "Docker is not running"; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "Docker Compose not found"; exit 1; }
echo "Preflight checks passed."

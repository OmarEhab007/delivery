#!/usr/bin/env sh
# Simple MongoDB backup helper that can be triggered by cron.
# Dumps the delivery-app database from the mongodb service into a compressed archive.

set -eu

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-${PROJECT_ROOT}/docker-compose.prod.yml}"
BACKUP_DIR="${BACKUP_DIR:-${PROJECT_ROOT}/backups}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_PATH="${BACKUP_DIR}/delivery-app-${TIMESTAMP}.archive.gz"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker command not found" >&2
  exit 1
fi

mkdir -p "${BACKUP_DIR}"

docker compose -f "${COMPOSE_FILE}" exec -T mongodb \
  sh -c "mongodump --username \"\${APP_DB_USER}\" \
                   --password \"\${APP_DB_PASSWORD}\" \
                   --authenticationDatabase \"\${MONGO_INITDB_DATABASE:-admin}\" \
                   --db \"\${APP_DB_NAME:-delivery-app}\" \
                   --archive" | gzip > "${BACKUP_PATH}"

echo "Backup written to ${BACKUP_PATH}"

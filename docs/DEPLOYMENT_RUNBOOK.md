# Delivery App Deployment Runbook

This runbook documents the hardened production deployment workflow for the delivery application. It covers container builds, production Docker Compose usage, safe rollout and rollback procedures, and the backup strategy for MongoDB.

## Prerequisites

- Docker Engine 24+ with the `docker compose` plugin available on the host
- Access to a container registry (e.g. GHCR, ECR) for publishing tagged images
- Production `.env` secrets populated in `env/production.app.env` and `env/production.mongo.env`
- Host storage for volumes mounted by `docker-compose.prod.yml` (`app_logs`, `app_uploads`, `mongodb_data`, etc.)

## Container Build Pipeline

1. Build the multi-stage image targeting the hardened runtime stage:
   ```bash
   docker build --target runner -t registry.example.com/delivery-app:<git-sha> .
   ```
2. Run quick smoke tests locally if required (`docker compose -f docker-compose.prod.yml up app`).
3. Push the image to your registry:
   ```bash
   docker push registry.example.com/delivery-app:<git-sha>
   ```
4. Tag the image you intend to deploy with a human-friendly alias (e.g. `latest`, sprint number) after it passes verification.

> The runtime image only includes production dependencies and runs as the non-root `node` user. Health checks are wired to `/health` using `curl` inside the container.

## Production Docker Compose

Use `docker-compose.prod.yml` for production deployments. Key behaviours:

- `APP_IMAGE` (defaults to `delivery-app:prod`) allows pinning an exact image tag per deployment.
- Secrets and configuration are loaded from `env/production.app.env` and `env/production.mongo.env`.
- MongoDB runs with authentication enabled and is initialised through `docker/mongo-init-simple.js` using the same secret values.
- Health checks and `json-file` log rotation are enabled for every service.

## Rollout Procedure

1. **Prepare the target host**
   - Copy / update `env/production.app.env` and `env/production.mongo.env` with the secrets for the release.
   - Export the image tag that should be deployed: `export APP_IMAGE=registry.example.com/delivery-app:<git-sha>`.
2. **Pull the release image**
   ```bash
   docker pull "${APP_IMAGE}"
   ```
3. **Deploy**
   ```bash
   docker compose -f docker-compose.prod.yml up -d mongodb prometheus grafana
   docker compose -f docker-compose.prod.yml up -d app
   ```
   (`app` can be restarted independently to rollout application changes without bouncing the database.)
4. **Verify**
   - `docker compose -f docker-compose.prod.yml ps`
   - `docker compose -f docker-compose.prod.yml logs -f app`
   - Hit `https://<your-domain>/health` and confirm `{ "status": "ok" }`.
   - Confirm Grafana dashboards and MongoDB metrics are responding.

## Rollback Procedure

1. Identify the last known good image tag (e.g. `registry.example.com/delivery-app:<previous>`).
2. Export it before re-deploying: `export APP_IMAGE=registry.example.com/delivery-app:<previous>`.
3. Re-run the deployment command: `docker compose -f docker-compose.prod.yml up -d app`.
4. Validate via `docker compose ... ps` and application health endpoints.
5. If schema changes were part of the rollout, follow your database migration rollback plan before restarting traffic.

> Tip: keep a changelog of deployed image tags in your release tracker to simplify this step. The compose file never needs editing—only `APP_IMAGE` changes between releases.

## Backup Strategy

MongoDB backups are automated via `scripts/backup/mongodb-backup.sh`:

- The script streams a compressed archive from the `mongodb` container using `mongodump`.
- Backups are stored under `${BACKUP_DIR:-<repo>/backups}` with timestamped names.

### Setup

1. Ensure Docker can execute non-interactively (cron must have access to the Docker socket).
2. Set a persistent backup directory, for example `/var/backups/delivery-app`.
3. (Optional) Create a dedicated log file for cron output (e.g. `/var/log/delivery-app-backup.log`).

### Cron Job Example

Add the following to the host crontab (`crontab -e`) to run a daily backup at 02:15:

```cron
15 2 * * * BACKUP_DIR=/var/backups/delivery-app \
  COMPOSE_FILE=/opt/delivery-app/docker-compose.prod.yml \
  /opt/delivery-app/scripts/backup/mongodb-backup.sh >> /var/log/delivery-app-backup.log 2>&1
```

Adjust paths to match where the repository lives on the production host.

### Restore (Manual)

To restore the most recent archive:

```bash
latest_backup=$(ls -t /var/backups/delivery-app/delivery-app-*.archive.gz | head -n1)
gzip -dc "${latest_backup}" | docker compose -f docker-compose.prod.yml exec -T mongodb \
  sh -c "mongorestore --archive --drop"
```

Be sure to halt the application (`docker compose ... stop app`) while restoring to avoid conflicts.

## Operational Checklist

- Monitor `docker compose ... logs app` for abnormalities after each rollout.
- Confirm space on the backup volume; prune files older than your retention window (e.g. via an additional cron entry).
- Periodically test restoration in a staging environment to validate backups.

## Security Hardening Checklist

1. Populate `env/production.app.env` and `env/production.mongo.env` with strong secrets. `npm start` will fail if mandatory values use placeholders (`JWT_SECRET`, `COOKIE_SECRET`, admin credentials).
2. Keep Swagger disabled by default (`ENABLE_SWAGGER=false`). When documentation access is needed, temporarily set it to `true`; only authenticated admins can reach `/api-docs` and `/api-docs-json`.
3. Metrics endpoints require admin JWTs. Configure Prometheus to supply an auth token via scrape headers or deploy behind an internal reverse proxy.
4. Ensure host directories mapped to `app_logs` and `app_uploads` are owned by UID 1000 (the `node` user inside the container) or adjust with `chown -R 1000:1000 /var/lib/delivery-app/app_{logs,uploads}`.
5. Front the application with an HTTPS reverse proxy (nginx, Caddy, Traefik). Terminate TLS there, forward traffic to the container's port 3000, and allow only loopback access to MongoDB and metrics containers.
6. Prometheus and Grafana should listen on private interfaces; tighten access through firewall rules or VPN.
7. After each deploy run `docker compose -f docker-compose.prod.yml logs app` and hit `/health` over HTTPS to confirm `Cache-Control: no-store`.

## Reverse Proxy Example (nginx)

```nginx
server {
  listen 443 ssl;
  server_name api.deliveryapp.example;

  ssl_certificate /etc/letsencrypt/live/api.deliveryapp.example/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.deliveryapp.example/privkey.pem;

  location / {
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_pass http://127.0.0.1:3000;
  }
}

server {
  listen 80;
  server_name api.deliveryapp.example;
  return 301 https://$host$request_uri;
}
```

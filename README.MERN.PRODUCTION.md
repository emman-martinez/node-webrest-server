# Production Deployment Guide (Node + Mongoose + MongoDB)

This guide is for deploying a MERN backend safely in production.

## Version matrix (recommended)

- Node.js: 20.19+ (or 22 LTS)
- TypeScript: 5.9+
- Mongoose: 8+
- MongoDB: 7+

## 1) Production principles

- Build once, run compiled code (`dist`).
- Keep secrets in environment variables.
- Use restricted CORS in production.
- Always deploy with health and readiness checks.

## 2) Required environment variables

Example:

```env
NODE_ENV=production
PORT=3000
MONGO_URI=mongodb://user:password@mongo-host:27017/appdb?authSource=admin
CORS_ORIGIN=https://my-frontend.com
```

## 3) Install and build

On the server:

```bash
npm ci
npm run build
```

## 4) Start the app

```bash
npm run start
```

`start` should run compiled output (for example `node dist/app.js`).

## 5) Recommended process manager (PM2)

Install PM2:

```bash
npm i -g pm2
```

Run app:

```bash
pm2 start dist/app.js --name my-mern-api
pm2 save
pm2 startup
```

Useful commands:

```bash
pm2 status
pm2 logs my-mern-api
pm2 restart my-mern-api
pm2 stop my-mern-api
```

## 6) Reverse proxy + HTTPS (Nginx + Certbot)

Put Nginx in front of Node and route traffic to `127.0.0.1:3000`.

Example Nginx block:

```nginx
server {
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then issue TLS certificates with Certbot.

## 7) Health and readiness checks

Expose:

- `/api/health`: process is alive
- `/api/ready`: app is ready to serve traffic (Mongo is connected)

Example implementation:

```ts
import mongoose from "mongoose";

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true, status: "alive" });
});

app.get("/api/ready", (_req, res) => {
  const isReady = mongoose.connection.readyState === 1;
  if (!isReady) return res.status(503).json({ ok: false, status: "not_ready" });
  res.status(200).json({ ok: true, status: "ready" });
});
```

Optional Docker healthcheck:

```yaml
services:
  api:
    build: .
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/ready"]
      interval: 30s
      timeout: 5s
      retries: 5
      start_period: 20s
```

## 8) Mongo backups

At minimum, schedule daily backups with `mongodump` and test restore regularly.

Example:

```bash
mongodump --uri="$MONGO_URI" --out="./backup-$(date +%F)"
```

Restore example:

```bash
mongorestore --uri="$MONGO_URI" ./backup-YYYY-MM-DD
```

## 9) Release checklist

1. Pull latest code.
2. `npm ci`
3. `npm run build`
4. Restart process (`pm2 restart my-mern-api`)
5. Smoke test:
   - `GET /api/health`
   - `GET /api/ready`
   - One DB endpoint (example: `/api/todos`)

## 10) Rollback strategy

- Keep previous release artifact or previous git tag.
- If deploy fails:
  1. Roll back app version.
  2. Restart process.
  3. Validate health/readiness endpoints.
- If issue is DB data related, restore from latest valid backup.

## 11) Common mistakes to avoid

- Using permissive CORS (`*`) in production.
- Deploying without `/api/ready`.
- Not handling graceful shutdown (`SIGINT`/`SIGTERM`).
- No backup/restore plan for Mongo.

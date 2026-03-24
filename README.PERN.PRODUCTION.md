# Production Deployment Guide (Node + Prisma + PostgreSQL)

This guide is for deploying the backend safely in production.

## Version matrix (recommended)

- Node.js: 20.19+ (or 22 LTS)
- TypeScript: 5.9+
- Prisma: 7.5+
- PostgreSQL: 15+

## 1) Production principles

- Use committed migrations only.
- Never run `prisma migrate dev` in production.
- Build once, run compiled code (`dist`).
- Keep secrets in environment variables.

## 2) Required environment variables

Create production env vars (example):

```env
NODE_ENV=production
PORT=3000
POSTGRES_URL=postgresql://user:password@db-host:5432/appdb
```

If you use CORS origin restrictions, also define your frontend domain(s), for example:

```env
CORS_ORIGIN=https://my-frontend.com
```

## 3) Install and build

On the server:

```bash
npm ci
npm run build
```

## 4) Run Prisma migrations (production-safe)

Use:

```bash
npx prisma migrate deploy --schema prisma/schema.prisma
```

If your project includes a script, this is equivalent:

```bash
npm run prisma:migrate:prod
```

## 5) Start the app

```bash
npm run start
```

`start` should run compiled output (for example `node dist/app.js`).

## 6) Recommended process manager (PM2)

Install PM2 globally:

```bash
npm i -g pm2
```

Run app:

```bash
pm2 start dist/app.js --name my-pern-api
pm2 save
pm2 startup
```

Useful commands:

```bash
pm2 status
pm2 logs my-pern-api
pm2 restart my-pern-api
pm2 stop my-pern-api
```

## 7) Reverse proxy + HTTPS (Nginx + Certbot)

- Put Nginx in front of Node.
- Route `https://api.yourdomain.com` to `http://127.0.0.1:3000`.
- Issue TLS certificates with Certbot.

Minimal Nginx site block example:

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

After that, run Certbot for HTTPS.

## 7.1) Health and readiness checks

Expose two endpoints in your API:

- `/api/health`: process is alive
- `/api/ready`: app is ready to serve traffic (for example DB connection works)

Example implementation (`src/app.ts`) with Prisma:

```ts
import express from "express";
import prismaClient from "./data/postgres";

const app = express();

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true, status: "alive" });
});

app.get("/api/ready", async (_req, res) => {
  try {
    await prismaClient.$queryRaw`SELECT 1`;
    res.status(200).json({ ok: true, status: "ready" });
  } catch (error) {
    res.status(503).json({
      ok: false,
      status: "not_ready",
      error: "Database unavailable",
    });
  }
});
```

Use these endpoints for:

- Load balancer health checks
- Nginx/Docker orchestration checks
- Post-deploy smoke tests

Optional Docker healthcheck example:

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

## 8) Database backups

At minimum, schedule daily `pg_dump` backups and test restore periodically.

Example command:

```bash
pg_dump "$POSTGRES_URL" > backup-$(date +%F).sql
```

## 9) Release checklist

1. Pull latest code.
2. `npm ci`
3. `npm run build`
4. `npx prisma migrate deploy --schema prisma/schema.prisma`
5. Restart process (`pm2 restart my-pern-api`)
6. Smoke test:
   - `GET /api/health`
   - `GET /api/ready`
   - One DB endpoint (example: `/api/todos`)

## 10) Rollback strategy

- Keep previous release artifact or previous git tag.
- If deploy fails:
  1. Roll back app version.
  2. Restart process.
  3. Validate health endpoint.
- For DB rollback, use forward-fix migrations when possible (safer than manual destructive rollback).

## 11) Common mistakes to avoid

- Running `prisma migrate dev` in production.
- Starting app before `migrate deploy`.
- Hardcoding secrets in source code.
- Deploying without a health check endpoint.

# PERN Backend Starter Guide (TypeScript + Prisma)

This guide is a reusable base to start a backend project with:

- PostgreSQL
- Docker
- Express
- TypeScript
- Prisma
- Jest
- Node.js

## Version matrix (recommended)

- Node.js: 20.19+ (or 22 LTS)
- TypeScript: 5.9+
- Prisma: 7.5+
- PostgreSQL: 15+

## 1) Create project

```bash
mkdir my-pern-api
cd my-pern-api
npm init -y
```

## 1.1) Pin Node version (recommended)

Create `.nvmrc`:

```bash
echo "22" > .nvmrc
```

Add `engines` to `package.json`:

```json
{
  "engines": {
    "node": ">=20.19.0"
  }
}
```

## 2) Install dependencies

```bash
npm i express cors dotenv env-var @prisma/client @prisma/adapter-pg pg
npm i -D typescript ts-node-dev prisma rimraf @types/node @types/express @types/pg
```

## 2.1) Install Jest for testing

```bash
npm i -D jest ts-jest @types/jest supertest @types/supertest
```

Generate Jest config for TypeScript:

```bash
npx ts-jest config:init
```

## 2.2) Add ESLint + Prettier (recommended)

```bash
npm i -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier eslint-config-prettier
```

Add scripts:

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier . --write",
    "format:check": "prettier . --check"
  }
}
```

Create `eslint.config.js`:

```js
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");

module.exports = [
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: false,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
```

Create `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 80
}
```

## 3) Generate TypeScript config

Use the current TypeScript command:

```bash
npx tsc --init
```

This generates a default `tsconfig.json`. Update it to this minimal backend setup:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

## 4) Add npm scripts

Edit `package.json`:

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --clear src/app.ts",
    "build": "rimraf dist && tsc",
    "start": "node dist/app.js",
    "test": "jest --runInBand",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "prisma:migrate:prod": "prisma migrate deploy --schema prisma/schema.prisma",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier . --write",
    "format:check": "prettier . --check"
  }
}
```

## 5) Add Docker PostgreSQL

Create `docker-compose.yml`:

```yaml
services:
  postgres-db:
    image: postgres:15.3
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - ./postgres:/var/lib/postgresql/data
    ports:
      - 5432:5432
```

## 6) Add environment variables

Create `.env`:

```env
PORT=3000
NODE_ENV=development

POSTGRES_USER=postgres
POSTGRES_DB=appdb
POSTGRES_PASSWORD=123456
POSTGRES_PORT=5432
POSTGRES_URL=postgresql://postgres:123456@localhost:5432/appdb
```

Create `.env.example` with the same keys (without real secrets):

```env
PORT=3000
NODE_ENV=development
POSTGRES_USER=postgres
POSTGRES_DB=appdb
POSTGRES_PASSWORD=changeme
POSTGRES_PORT=5432
POSTGRES_URL=postgresql://postgres:changeme@localhost:5432/appdb
```

## 7) Initialize Prisma

```bash
npx prisma init
```

If `prisma.config.ts` was not generated, create it manually in the project root:

```ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["POSTGRES_URL"],
  },
});
```

## 8) Define schema

Update `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model todo {
  id          Int       @id @default(autoincrement())
  title       String
  completedAt DateTime?
}
```

## 9) Run database and Prisma

```bash
docker compose up -d
npx prisma generate --schema prisma/schema.prisma
npx prisma migrate dev --schema prisma/schema.prisma --name init
```

## 10) Create basic app structure

```bash
mkdir -p src/config src/data/postgres
touch src/app.ts src/config/envs.ts src/data/postgres/index.ts
```

Recommended scalable structure:

```txt
src/
  app.ts
  config/
    envs.ts
  data/
    postgres/
      index.ts
  presentation/
    routes.ts
    controllers/
  domain/
    dtos/
    entities/
  infrastructure/
    repositories/
```

`src/config/envs.ts`:

```ts
import "dotenv/config";
import { get } from "env-var";

export const envs = {
  PORT: get("PORT").default("3000").asPortNumber(),
  POSTGRES_URL: get("POSTGRES_URL").required().asString(),
};
```

`src/data/postgres/index.ts`:

```ts
import { PrismaPg } from "@prisma/adapter-pg";
import { envs } from "../../config/envs";
import { PrismaClient } from "../../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: envs.POSTGRES_URL });
const prismaClient = new PrismaClient({ adapter });

export default prismaClient;
```

`src/app.ts`:

```ts
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { envs } from "./config/envs";
import prismaClient from "./data/postgres";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/todos", async (_req, res) => {
  const todos = await prismaClient.todo.findMany();
  res.json(todos);
});

// Global error middleware
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

const server = app.listen(envs.PORT, () => {
  console.log(`Server is running on port: ${envs.PORT}`);
});

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`Received ${signal}. Closing server...`);
  server.close(async () => {
    await prismaClient.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
```

## 11) Start API

```bash
npm run dev
```

Test:

- `GET http://localhost:3000/api/health`
- `GET http://localhost:3000/api/todos`

## 12) Add a first Jest test

Create `src/app.test.ts`:

```ts
import request from "supertest";
import express from "express";

describe("GET /api/health", () => {
  it("should return 200 and ok=true", async () => {
    const app = express();
    app.get("/api/health", (_req, res) => res.json({ ok: true }));

    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });
});
```

Run tests:

```bash
npm run test
```

## 12.1) Seed initial data (optional)

Run:

```bash
npm run seed
```

This executes `prisma/seed.ts` and inserts sample todos.

## 13) Add CI (GitHub Actions, recommended)

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
  pull_request:

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npm run test
```

## Notes

- If you rename the DB variable in `.env`, update `process.env["POSTGRES_URL"]` in `prisma.config.ts`.
- `npx prisma migrate dev ...` creates migration files and applies them.
- `npx prisma db push ...` updates DB directly without migration files.
- In production/staging, use:
  - `npx prisma migrate deploy --schema prisma/schema.prisma`
  - or `npm run prisma:migrate:prod` if you added that script.

## Troubleshooting

If you see an IDE warning in `src/data/postgres/index.ts` for `../../generated/prisma/client`:

```bash
npx prisma generate --schema prisma/schema.prisma
```

This can happen because `src/generated/prisma` is generated locally and is usually gitignored.

If you see `Cannot find module '@prisma/adapter-pg'` in the editor:

```bash
npm install
npm i @prisma/adapter-pg @prisma/client pg
```

Then in VS Code:

1. `TypeScript: Select TypeScript Version` -> `Use Workspace Version`
2. `TypeScript: Restart TS Server`
3. Confirm VS Code is opened at project root (`package.json` folder)

## Why these recommendations matter

- `.nvmrc` (pin Node version)
  Keeps all developers and CI on the same Node version, reducing "works on my machine" issues.

- `engines` in `package.json`
  Documents the supported Node range and warns when someone runs the project with an incompatible runtime.

- `eslint + prettier`
  ESLint catches code-quality issues and common mistakes; Prettier enforces consistent formatting automatically.

- Basic CI (GitHub Actions: install, build, test)
  Runs validation on every push/PR so broken code is detected early before merging.

- Well-maintained `.env.example`
  Makes onboarding faster by showing required env keys and expected formats without exposing secrets.

- CORS + global error handling in Express
  CORS controls which frontends can call your API; global error middleware gives consistent, safe API error responses.

- Graceful shutdown (`SIGINT`/`SIGTERM`)
  Closes HTTP server and DB connections cleanly during stop/redeploy, preventing hanging processes and connection leaks.

- Production note: use `prisma migrate deploy` (not `migrate dev`)
  `migrate deploy` is deterministic and applies committed migrations only; `migrate dev` is for local development and can create new migrations interactively.

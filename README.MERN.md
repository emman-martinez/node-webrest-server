# MERN Backend Starter Guide (TypeScript + Mongoose)

This guide is a reusable base to start a backend project with:

- MongoDB
- Docker
- Express
- TypeScript
- Mongoose
- Jest
- Node.js

## Version matrix (recommended)

- Node.js: 20.19+ (or 22 LTS)
- TypeScript: 5.9+
- Mongoose: 8+
- MongoDB: 7+

## 1) Create project

```bash
mkdir my-mern-api
cd my-mern-api
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
npm i express cors dotenv env-var mongoose
npm i -D typescript ts-node-dev rimraf @types/node @types/express
```

## 2.1) Install Jest for testing

```bash
npm i -D jest ts-jest @types/jest supertest @types/supertest mongodb-memory-server
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

```bash
npx tsc --init
```

Update `tsconfig.json` to this minimal backend setup:

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
    "seed": "ts-node-dev --respawn --transpile-only src/seeds/seed.ts",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier . --write",
    "format:check": "prettier . --check"
  }
}
```

## 5) Add Docker MongoDB

Create `docker-compose.yml`:

```yaml
services:
  mongo-db:
    image: mongo:7
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
      MONGO_INITDB_DATABASE: ${MONGO_DB}
    volumes:
      - ./mongo:/data/db
    ports:
      - 27017:27017
```

## 6) Add environment variables

Create `.env`:

```env
PORT=3000
NODE_ENV=development

MONGO_USER=admin
MONGO_PASSWORD=123456
MONGO_DB=appdb
MONGO_PORT=27017
MONGO_URI=mongodb://admin:123456@localhost:27017/appdb?authSource=admin
```

Create `.env.example`:

```env
PORT=3000
NODE_ENV=development
MONGO_USER=admin
MONGO_PASSWORD=changeme
MONGO_DB=appdb
MONGO_PORT=27017
MONGO_URI=mongodb://admin:changeme@localhost:27017/appdb?authSource=admin
```

## 7) Create basic app structure

```bash
mkdir -p src/config src/data/mongo src/domain/models src/seeds
touch src/app.ts src/config/envs.ts src/data/mongo/index.ts src/domain/models/todo.model.ts src/seeds/seed.ts
```

Recommended scalable structure:

```txt
src/
  app.ts
  config/
    envs.ts
  data/
    mongo/
      index.ts
  domain/
    dtos/
    entities/
    models/
  presentation/
    routes.ts
    controllers/
  infrastructure/
    repositories/
  seeds/
    seed.ts
```

## 8) Add Mongoose config and model

`src/config/envs.ts`:

```ts
import "dotenv/config";
import { get } from "env-var";

export const envs = {
  PORT: get("PORT").default("3000").asPortNumber(),
  MONGO_URI: get("MONGO_URI").required().asString(),
};
```

`src/data/mongo/index.ts`:

```ts
import mongoose from "mongoose";
import { envs } from "../../config/envs";

export const connectMongo = async (): Promise<void> => {
  await mongoose.connect(envs.MONGO_URI);
};

export const disconnectMongo = async (): Promise<void> => {
  await mongoose.disconnect();
};
```

`src/domain/models/todo.model.ts`:

```ts
import { Schema, model } from "mongoose";

interface Todo {
  title: string;
  completedAt: Date | null;
}

const todoSchema = new Schema<Todo>(
  {
    title: { type: String, required: true, trim: true },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

export const TodoModel = model<Todo>("Todo", todoSchema);
```

## 9) Build API with health + readiness + graceful shutdown

`src/app.ts`:

```ts
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { envs } from "./config/envs";
import { connectMongo, disconnectMongo } from "./data/mongo";
import { TodoModel } from "./domain/models/todo.model";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true, status: "alive" });
});

app.get("/api/ready", (_req, res) => {
  const isReady = mongoose.connection.readyState === 1;
  if (!isReady) {
    return res.status(503).json({ ok: false, status: "not_ready" });
  }
  res.status(200).json({ ok: true, status: "ready" });
});

app.get("/api/todos", async (_req, res, next) => {
  try {
    const todos = await TodoModel.find().lean();
    res.json(todos);
  } catch (error) {
    next(error);
  }
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

const bootstrap = async () => {
  await connectMongo();

  const server = app.listen(envs.PORT, () => {
    console.log(`Server is running on port: ${envs.PORT}`);
  });

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}. Closing server...`);
    server.close(async () => {
      await disconnectMongo();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

bootstrap().catch((error) => {
  console.error("Bootstrap failed:", error);
  process.exit(1);
});
```

## 10) Start Mongo and API

```bash
docker compose up -d
npm run dev
```

Test:

- `GET http://localhost:3000/api/health`
- `GET http://localhost:3000/api/ready`
- `GET http://localhost:3000/api/todos`

## 11) Add seed data

`src/seeds/seed.ts`:

```ts
import { connectMongo, disconnectMongo } from "../data/mongo";
import { TodoModel } from "../domain/models/todo.model";

const run = async () => {
  await connectMongo();

  await TodoModel.insertMany([
    { title: "Set up MERN project", completedAt: null },
    { title: "Create first endpoint", completedAt: null },
    { title: "Write tests", completedAt: null },
  ]);

  console.log("Seed completed successfully.");
  await disconnectMongo();
};

run().catch(async (error) => {
  console.error("Seed failed:", error);
  await disconnectMongo();
  process.exit(1);
});
```

Run:

```bash
npm run seed
```

## 12) Add a first Jest test

Create `src/app.test.ts`:

```ts
import express from "express";
import request from "supertest";

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

- If you rename the DB variable in `.env`, update `process.env["MONGO_URI"]` usage.
- Keep CORS restricted in production to trusted frontend domains.
- Use health/readiness endpoints in load balancer and deployment checks.

## Troubleshooting

If Mongo auth fails:

1. Validate `.env` credentials (`MONGO_USER`, `MONGO_PASSWORD`, `MONGO_DB`).
2. Confirm URI includes `authSource=admin`.
3. Restart container with a clean volume if needed:

```bash
docker compose down -v
docker compose up -d
```

If VS Code shows TypeScript module warnings but build works:

1. `TypeScript: Select TypeScript Version` -> `Use Workspace Version`
2. `TypeScript: Restart TS Server`
3. Confirm VS Code is opened at project root

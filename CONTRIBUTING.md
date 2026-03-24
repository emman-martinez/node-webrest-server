# Contributing

Thanks for contributing.

## Setup

```bash
npm install
cp .env.template .env
docker compose up -d
npx prisma generate --schema prisma/schema.prisma
npx prisma migrate dev --schema prisma/schema.prisma --name init
```

## Run locally

```bash
npm run dev
```

## Tests

```bash
npm run test
```

## Seed data

```bash
npm run seed
```

## Pull requests

1. Create a feature branch.
2. Keep changes focused and small.
3. Run build/tests before opening PR.
4. Describe what changed and why.

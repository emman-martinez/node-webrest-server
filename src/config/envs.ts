import "dotenv/config";
import { get } from "env-var";

const postgresUrl = get("POSTGRES_URL").asString();
const databaseUrl = get("DATABASE_URL").asString();
const resolvedDatabaseUrl = postgresUrl ?? databaseUrl;

if (!resolvedDatabaseUrl) {
  throw new Error(
    "Missing database URL. Set POSTGRES_URL or DATABASE_URL in environment variables."
  );
}

export const envs = {
  // PORT: The port number on which the server will listen. It is required and must be a valid port number.
  PORT: get("PORT").required().asPortNumber(),
  // PUBLIC_PATH: The path to the public folder that will be served by the server. It is optional and defaults to "public" if not provided.
  PUBLIC_PATH: get("PUBLIC_PATH").default("public").asString(),
  // POSTGRES_URL: Full PostgreSQL connection URL used by Prisma adapter.
  // Falls back to DATABASE_URL for compatibility with hosting providers.
  POSTGRES_URL: resolvedDatabaseUrl,
};

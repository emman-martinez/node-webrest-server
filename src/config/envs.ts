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
  PORT: get("PORT").required().asPortNumber(),
  PUBLIC_PATH: get("PUBLIC_PATH").default("public").asString(),
  POSTGRES_URL: resolvedDatabaseUrl,
};

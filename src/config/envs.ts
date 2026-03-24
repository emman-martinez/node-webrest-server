import "dotenv/config";
import { get } from "env-var";

const buildUrlFromRailwayPgVars = () => {
  const host = process.env["PGHOST"];
  const port = process.env["PGPORT"] ?? "5432";
  const user = process.env["PGUSER"];
  const password = process.env["PGPASSWORD"];
  const database = process.env["PGDATABASE"];

  if (!host || !user || !password || !database) {
    return undefined;
  }

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
};

const postgresUrl = get("POSTGRES_URL").asString();
const databaseUrl = get("DATABASE_URL").asString();
const pgVarsUrl = buildUrlFromRailwayPgVars();
const resolvedDatabaseUrl = postgresUrl ?? databaseUrl ?? pgVarsUrl;

if (!resolvedDatabaseUrl) {
  throw new Error(
    "Missing database URL. Set POSTGRES_URL or DATABASE_URL, or PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE in environment variables."
  );
}

export const envs = {
  PORT: get("PORT").required().asPortNumber(),
  PUBLIC_PATH: get("PUBLIC_PATH").default("public").asString(),
  POSTGRES_URL: resolvedDatabaseUrl,
};

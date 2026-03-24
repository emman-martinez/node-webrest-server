import "dotenv/config";
import { get } from "env-var";

export const envs = {
  // PORT: The port number on which the server will listen. It is required and must be a valid port number.
  PORT: get("PORT").required().asPortNumber(),
  // PUBLIC_PATH: The path to the public folder that will be served by the server. It is optional and defaults to "public" if not provided.
  PUBLIC_PATH: get("PUBLIC_PATH").default("public").asString(),
  // POSTGRES_URL: Full PostgreSQL connection URL used by Prisma adapter.
  POSTGRES_URL: get("POSTGRES_URL").required().asString(),
};

import { PrismaPg } from "@prisma/adapter-pg";
import { envs } from "../../config/envs";
import { PrismaClient } from "../../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: envs.POSTGRES_URL });

const prismaClient = new PrismaClient({ adapter });

export default prismaClient;

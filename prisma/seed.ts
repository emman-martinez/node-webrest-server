import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString =
  process.env["POSTGRES_URL"] ?? process.env["DATABASE_URL"];

if (!connectionString) {
  console.error(
    "Missing database URL. Set POSTGRES_URL or DATABASE_URL in environment variables."
  );
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.todo.createMany({
    data: [
      { title: "Set up project structure", completedAt: null },
      { title: "Create first migration", completedAt: null },
      { title: "Write first API tests", completedAt: null },
    ],
  });

  console.log("Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

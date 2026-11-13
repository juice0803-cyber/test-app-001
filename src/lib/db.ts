import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { runtimeConfig } from "./env";
const globalDb = globalThis as unknown as { fitnessPrisma?: PrismaClient };
export function getDb() {
  if (!globalDb.fitnessPrisma) {
    const { databaseUrl } = runtimeConfig();
    globalDb.fitnessPrisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl, max: Number(process.env.DB_POOL_MAX ?? 5), connectionTimeoutMillis: 5000 }), log: [] });
  }
  return globalDb.fitnessPrisma;
}

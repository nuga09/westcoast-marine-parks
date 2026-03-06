import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

declare global {
  var globalForPrisma: { prisma?: PrismaClient };
}

// Create a Postgres pool for the adapter
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export const db =
  globalThis.globalForPrisma?.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(pool, { schema: 'app' }),
    log: ["query"],
  });

// Prevent multiple instances in dev
if (process.env.NODE_ENV !== "production") globalThis.globalForPrisma = { prisma: db };

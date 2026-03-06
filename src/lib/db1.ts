import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

// Adapter configuration
const pgAdapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

// Prevent multiple clients in Next.js hot reload
declare global {
  var prisma: PrismaClient | undefined;
}

export const db =
  globalThis.prisma ??
  new PrismaClient({
    adapter: pgAdapter,
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;

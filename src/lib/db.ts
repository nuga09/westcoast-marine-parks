import { PrismaClient } from "@prisma/client";

export const db =
  globalThis.__prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalThis.__prisma = db;


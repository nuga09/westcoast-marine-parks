import { PrismaPgAdapter } from "@prisma/adapter-pg";

// Note: Adapter configuration is handled through environment variables
// This file is kept for reference but the actual config is in the root prisma.config.ts

export const adapter = new PrismaPgAdapter({
  connectionString: process.env.DATABASE_URL || "",
});


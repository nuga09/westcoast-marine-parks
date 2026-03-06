// test-db.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Create Prisma client using Postgres adapter
const db = new PrismaClient({
  adapter: new PrismaPg({
    user: "myuser",             // your DB user
    password: "mypassword",     // your DB password
    host: "localhost",          // DB host
    port: 5432,                 // default Postgres port
    database: "westcoast_marine", // your DB name
  }),
  log: ["query"],               // optional: logs queries
});

async function main() {
  try {
    // Test query: get the first dailyMessage
    const message = await db.dailyMessage.findFirst();
    console.log("Daily message:", message);
  } catch (err) {
    console.error("Error querying database:", err);
  } finally {
    await db.$disconnect();
  }
}

// Run main
main();

import { PrismaClient, BookingStatus, BookingType, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter: new PrismaPg(pool, { schema: 'app' }) });

function startOfTodayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
}

async function main() {
  const serviceDate = startOfTodayUtc();

  const adminEmail = "admin@westcoastmarine.local";
  const customerEmail = "customer@westcoastmarine.local";

  const adminPasswordHash = await bcrypt.hash("Admin123!", 12);
  const customerPasswordHash = await bcrypt.hash("Customer123!", 12);

  const admin = await db.user.upsert({
    where: { email: adminEmail },
    update: { name: "Westcoast Admin", role: Role.ADMIN },
    create: {
      name: "Westcoast Admin",
      email: adminEmail,
      phone: "000-000-0000",
      address: "Westcoast Marine Yard",
      role: Role.ADMIN,
      passwordHash: adminPasswordHash,
    },
  });

  const customer = await db.user.upsert({
    where: { email: customerEmail },
    update: { name: "Sample Customer", role: Role.CUSTOMER },
    create: {
      name: "Sample Customer",
      email: customerEmail,
      phone: "111-111-1111",
      address: "123 Harbour St",
      role: Role.CUSTOMER,
      passwordHash: customerPasswordHash,
    },
  });

  const vesselA = await db.vessel.upsert({
    where: { yardNumber: "YD102" },
    update: { boatName: "Sea Breeze", boatType: "Sailboat", boatNumber: "A-100" },
    create: {
      userId: customer.id,
      boatName: "Sea Breeze",
      boatType: "Sailboat",
      boatNumber: "A-100",
      yardNumber: "YD102",
    },
  });

  const vesselB = await db.vessel.upsert({
    where: { yardNumber: "YD087" },
    update: { boatName: "Harbour Runner", boatType: "Motorboat", boatNumber: "B-200" },
    create: {
      userId: customer.id,
      boatName: "Harbour Runner",
      boatType: "Motorboat",
      boatNumber: "B-200",
      yardNumber: "YD087",
    },
  });

  await db.dailyMessage.upsert({
    where: { serviceDate },
    update: {
      message: "Daily schedule: launches start 10:00, retrievals start 16:00 (tide-dependent).",
      launchStartTime: "10:00",
      retrievalStartTime: "16:00",
      updatedByUserId: admin.id,
    },
    create: {
      serviceDate,
      message: "Daily schedule: launches start 10:00, retrievals start 16:00 (tide-dependent).",
      launchStartTime: "10:00",
      retrievalStartTime: "16:00",
      updatedByUserId: admin.id,
    },
  });

  // Seed a couple of queue entries for today (so UI has something live).
  const seedBookings = [
    {
      vesselId: vesselA.id,
      type: BookingType.LAUNCH,
      serviceDate,
      status: BookingStatus.PENDING,
      createdByUserId: customer.id,
    },
    {
      vesselId: vesselB.id,
      type: BookingType.RETRIEVAL,
      serviceDate,
      status: BookingStatus.PENDING,
      createdByUserId: customer.id,
    },
  ] as const;

  for (const b of seedBookings) {
    const existing = await db.booking.findFirst({
      where: {
        vesselId: b.vesselId,
        type: b.type,
        serviceDate: b.serviceDate,
        status: b.status,
      },
      select: { id: true },
    });
    if (!existing) await db.booking.create({ data: b });
  }

  console.log("Seed complete.");
  console.log("Admin login:", adminEmail, "password:", "Admin123!");
  console.log("Customer login:", customerEmail, "password:", "Customer123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });


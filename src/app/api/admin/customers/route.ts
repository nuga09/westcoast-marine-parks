import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";

export const runtime = "nodejs";

const CreateCustomerSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(320).transform((s) => s.toLowerCase().trim()),
  password: z.string().min(8).max(200),
  phone: z.string().min(3).max(50).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  address: z.string().min(3).max(200).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  vessel: z.object({
    boatName: z.string().min(1).max(120),
    boatType: z.string().min(1).max(120).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
    boatNumber: z.string().min(1).max(120),
    yardNumber: z.string().min(1).max(120).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  }),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const customers = await db.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      createdAt: true,
      vessels: {
        orderBy: [{ yardNumber: "asc" }, { boatName: "asc" }],
        select: { id: true, yardNumber: true, boatName: true, boatType: true, boatNumber: true, updatedAt: true },
      },
    },
  });

  return NextResponse.json({ customers });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = CreateCustomerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const existing = await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (existing) return NextResponse.json({ error: "Email is already registered" }, { status: 409 });

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const created = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      address: parsed.data.address,
      passwordHash,
      role: "CUSTOMER",
      vessels: {
        create: {
          boatName: parsed.data.vessel.boatName,
          boatType: parsed.data.vessel.boatType,
          boatNumber: parsed.data.vessel.boatNumber,
          yardNumber: parsed.data.vessel.yardNumber,
        },
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}


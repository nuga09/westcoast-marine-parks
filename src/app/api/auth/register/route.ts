import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { SESSION_COOKIE_NAME, createSessionToken } from "@/lib/auth";

const RegisterSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(320).transform((s) => s.toLowerCase().trim()),
  password: z.string().min(8).max(200),
  phone: z.string().min(3).max(50).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  address: z.string().min(3).max(200).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  vessels: z
    .array(
      z.object({
        boatName: z.string().min(1).max(120),
        boatType: z.string().min(1).max(120).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
        boatNumber: z.string().min(1).max(120),
        yardNumber: z.string().min(1).max(120).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
      }),
    )
    .min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid registration data" }, { status: 400 });
  }

  const { name, email, password, phone, address, vessels } = parsed.data;

  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return NextResponse.json({ error: "Email is already registered" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.create({
    data: {
      name,
      email,
      phone,
      address,
      passwordHash,
      vessels: {
        create: vessels.map((v) => ({
          boatName: v.boatName,
          boatType: v.boatType,
          boatNumber: v.boatNumber,
          yardNumber: v.yardNumber,
        })),
      },
    },
    select: { id: true, role: true, name: true, email: true },
  });

  const token = await createSessionToken({ userId: user.id, role: user.role });

  const res = NextResponse.json({ user });
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}


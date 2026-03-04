import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";

export const runtime = "nodejs";

const CreateVesselSchema = z.object({
  boatName: z.string().min(1).max(120),
  boatType: z.string().min(1).max(120).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  boatNumber: z.string().min(1).max(120),
  yardNumber: z.string().min(1).max(120).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const vessels = await db.vessel.findMany({
    where: { userId: user.id },
    orderBy: [{ yardNumber: "asc" }, { boatName: "asc" }],
    select: {
      id: true,
      boatName: true,
      boatType: true,
      boatNumber: true,
      yardNumber: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json({ vessels });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = CreateVesselSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid vessel data" }, { status: 400 });

  const vessel = await db.vessel.create({
    data: { userId: user.id, ...parsed.data },
    select: { id: true, boatName: true, boatType: true, boatNumber: true, yardNumber: true },
  });
  return NextResponse.json({ vessel }, { status: 201 });
}


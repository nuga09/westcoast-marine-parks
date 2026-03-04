import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";

export const runtime = "nodejs";

const PatchSchema = z.object({
  boatName: z.string().min(1).max(120).optional(),
  boatType: z.string().min(1).max(120).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  boatNumber: z.string().min(1).max(120).optional(),
  yardNumber: z.string().min(1).max(120).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  try {
    const updated = await db.vessel.update({
      where: { id },
      data: parsed.data,
      select: { id: true, yardNumber: true, boatName: true, boatType: true, boatNumber: true, updatedAt: true },
    });
    return NextResponse.json({ vessel: updated });
  } catch {
    return NextResponse.json({ error: "Update failed (yard number may already exist)" }, { status: 400 });
  }
}


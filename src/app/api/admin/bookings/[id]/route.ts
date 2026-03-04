import { NextResponse } from "next/server";
import { z } from "zod";
import { BookingStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { emitQueuesUpdated } from "@/lib/realtime";

export const runtime = "nodejs";

const BodySchema = z.object({
  action: z.enum(["MARK_COMPLETED", "CANCEL", "SET_MOORING"]),
  stayingOnMooring: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const booking = await db.booking.findUnique({
    where: { id },
    select: { id: true, serviceDate: true, type: true, status: true, stayingOnMooring: true },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();

  if (parsed.data.action === "MARK_COMPLETED") {
    const updated = await db.booking.update({
      where: { id },
      data: { status: BookingStatus.COMPLETED, completedAt: now },
      select: { id: true, status: true, completedAt: true, stayingOnMooring: true, type: true, serviceDate: true },
    });
    emitQueuesUpdated(updated.serviceDate);
    return NextResponse.json({ booking: updated });
  }

  if (parsed.data.action === "CANCEL") {
    const updated = await db.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED, completedAt: now },
      select: { id: true, status: true, completedAt: true, stayingOnMooring: true, type: true, serviceDate: true },
    });
    emitQueuesUpdated(updated.serviceDate);
    return NextResponse.json({ booking: updated });
  }

  const stayingOnMooring = parsed.data.stayingOnMooring ?? !booking.stayingOnMooring;
  const updated = await db.booking.update({
    where: { id },
    data: { stayingOnMooring },
    select: { id: true, status: true, completedAt: true, stayingOnMooring: true, type: true, serviceDate: true },
  });
  emitQueuesUpdated(updated.serviceDate);
  return NextResponse.json({ booking: updated });
}


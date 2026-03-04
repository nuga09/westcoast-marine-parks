import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { startOfTodayLocal } from "@/lib/dates";
import { emitQueuesUpdated } from "@/lib/realtime";
import { BookingStatus, BookingType } from "@prisma/client";

export const runtime = "nodejs";

const CreateBookingSchema = z.object({
  vesselId: z.string().min(1),
  type: z.nativeEnum(BookingType),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = CreateBookingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid booking data" }, { status: 400 });

  const { vesselId, type } = parsed.data;
  const serviceDate = startOfTodayLocal();

  const vessel = await db.vessel.findUnique({
    where: { id: vesselId },
    select: {
      id: true,
      userId: true,
      yardNumber: true,
      boatName: true,
      boatNumber: true,
    },
  });
  if (!vessel) return NextResponse.json({ error: "Vessel not found" }, { status: 404 });
  if (user.role !== "ADMIN" && vessel.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await db.booking.findFirst({
    where: { vesselId, type, serviceDate, status: BookingStatus.PENDING },
    select: { id: true, requestedAt: true },
    orderBy: { requestedAt: "asc" },
  });

  const booking =
    existing ??
    (await db.booking.create({
      data: {
        vesselId,
        type,
        serviceDate,
        status: BookingStatus.PENDING,
        createdByUserId: user.id,
      },
      select: { id: true, requestedAt: true },
    }));

  const pending = await db.booking.findMany({
    where: { type, serviceDate, status: BookingStatus.PENDING },
    orderBy: [{ requestedAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      requestedAt: true,
      vessel: { select: { yardNumber: true } },
    },
  });

  const position = pending.findIndex((b) => b.id === booking.id) + 1;
  const queueVesselIds = pending.map((b) => b.vessel.yardNumber ?? "—");

  emitQueuesUpdated(serviceDate);

  return NextResponse.json({
    booking: { id: booking.id, type, serviceDate: serviceDate.toISOString(), requestedAt: booking.requestedAt },
    position,
    queue: queueVesselIds,
  });
}


import { NextResponse } from "next/server";
import { z } from "zod";
import { BookingStatus, BookingType } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { startOfTodayLocal } from "@/lib/dates";

export const runtime = "nodejs";

const ParamsSchema = z.object({
  type: z.nativeEnum(BookingType),
});

export async function GET(_req: Request, ctx: { params: Promise<{ type: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const paramsRaw = await ctx.params;
  const parsedParams = ParamsSchema.safeParse({ type: paramsRaw.type });
  if (!parsedParams.success) return NextResponse.json({ error: "Invalid queue type" }, { status: 400 });

  const type = parsedParams.data.type;
  const serviceDate = startOfTodayLocal();

  const dailyMessage = await db.dailyMessage.findUnique({
    where: { serviceDate },
    select: { message: true, launchStartTime: true, retrievalStartTime: true, updatedAt: true },
  });

  if (user.role === "ADMIN") {
    const pending = await db.booking.findMany({
      where: { type, serviceDate, status: BookingStatus.PENDING },
      orderBy: [{ requestedAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        requestedAt: true,
        completedAt: true,
        stayingOnMooring: true,
        vessel: {
          select: {
            id: true,
            yardNumber: true,
            boatName: true,
            boatNumber: true,
            owner: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    });

    const completed = await db.booking.findMany({
      where: { type, serviceDate, status: BookingStatus.COMPLETED },
      orderBy: [{ completedAt: "desc" }, { requestedAt: "asc" }],
      take: 200,
      select: {
        id: true,
        requestedAt: true,
        completedAt: true,
        stayingOnMooring: true,
        vessel: {
          select: {
            id: true,
            yardNumber: true,
            boatName: true,
            boatNumber: true,
            owner: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    });

    return NextResponse.json({
      serviceDate: serviceDate.toISOString(),
      dailyMessage:
        dailyMessage ??
        ({
          message: "No schedule posted yet for today.",
          launchStartTime: null,
          retrievalStartTime: null,
          updatedAt: null,
        } as const),
      pending,
      completed,
      counts: { pending: pending.length, completed: completed.length },
    });
  }

  // Customer view: show only vessel ID numbers in the queue.
  const pending = await db.booking.findMany({
    where: { type, serviceDate, status: BookingStatus.PENDING },
    orderBy: [{ requestedAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      requestedAt: true,
      completedAt: true,
      stayingOnMooring: true,
      vessel: { select: { id: true, yardNumber: true } },
    },
  });

  const completed = await db.booking.findMany({
    where: { type, serviceDate, status: BookingStatus.COMPLETED },
    orderBy: [{ completedAt: "desc" }, { requestedAt: "asc" }],
    take: 200,
    select: {
      id: true,
      requestedAt: true,
      completedAt: true,
      stayingOnMooring: true,
      vessel: { select: { id: true, yardNumber: true } },
    },
  });

  return NextResponse.json({
    serviceDate: serviceDate.toISOString(),
    dailyMessage:
      dailyMessage ??
      ({
        message: "No schedule posted yet for today.",
        launchStartTime: null,
        retrievalStartTime: null,
        updatedAt: null,
      } as const),
    pending,
    completed,
    counts: { pending: pending.length, completed: completed.length },
  });
}


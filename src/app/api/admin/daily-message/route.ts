import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { startOfTodayLocal } from "@/lib/dates";
import { emitQueuesUpdated } from "@/lib/realtime";

export const runtime = "nodejs";

const BodySchema = z.object({
  message: z.string().min(1).max(1000),
  launchStartTime: z.string().max(20).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  retrievalStartTime: z.string().max(20).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
});

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const serviceDate = startOfTodayLocal();

  const updated = await db.dailyMessage.upsert({
    where: { serviceDate },
    update: {
      message: parsed.data.message,
      launchStartTime: parsed.data.launchStartTime,
      retrievalStartTime: parsed.data.retrievalStartTime,
      updatedByUserId: user.id,
    },
    create: {
      serviceDate,
      message: parsed.data.message,
      launchStartTime: parsed.data.launchStartTime,
      retrievalStartTime: parsed.data.retrievalStartTime,
      updatedByUserId: user.id,
    },
    select: { serviceDate: true, message: true, launchStartTime: true, retrievalStartTime: true, updatedAt: true },
  });

  emitQueuesUpdated(serviceDate);
  return NextResponse.json({ dailyMessage: updated });
}


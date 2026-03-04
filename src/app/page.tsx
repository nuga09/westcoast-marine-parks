import { db } from "@/lib/db";
import { startOfTodayLocal } from "@/lib/dates";

export default function Home() {
  const serviceDate = startOfTodayLocal();
  const dailyMessagePromise = db.dailyMessage.findUnique({
    where: { serviceDate },
    select: { message: true, launchStartTime: true, retrievalStartTime: true, updatedAt: true },
  });

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Park & Launch Booking</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
          Book a same-day <span className="font-medium text-zinc-900">launch</span> from the yard or a same-day{" "}
          <span className="font-medium text-zinc-900">retrieval</span> as you come into the harbour. Live queues update
          in real time for customers and staff.
        </p>
      </div>

      <TodayMessage dailyMessagePromise={dailyMessagePromise} />
    </div>
  );
}

async function TodayMessage({
  dailyMessagePromise,
}: {
  dailyMessagePromise: Promise<{
    message: string;
    launchStartTime: string | null;
    retrievalStartTime: string | null;
    updatedAt: Date;
  } | null>;
}) {
  const dailyMessage = await dailyMessagePromise;
  const message = dailyMessage?.message ?? "No schedule posted yet for today.";
  const launchStart = dailyMessage?.launchStartTime;
  const retrievalStart = dailyMessage?.retrievalStartTime;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-900 to-zinc-700 p-6 text-white">
      <div className="text-xs font-semibold uppercase tracking-wide text-white/70">Today’s launch / retrieval info</div>
      <div className="mt-2 text-lg font-semibold">{message}</div>
      <div className="mt-3 flex flex-wrap gap-2 text-sm text-white/85">
        {launchStart ? (
          <span className="rounded-full bg-white/10 px-3 py-1">Launches start: {launchStart}</span>
        ) : null}
        {retrievalStart ? (
          <span className="rounded-full bg-white/10 px-3 py-1">Retrievals start: {retrievalStart}</span>
        ) : null}
      </div>
    </div>
  );
}

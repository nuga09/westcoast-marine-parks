"use client";

import * as React from "react";
import Link from "next/link";
import { BookingStatus, BookingType } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type VesselRow = {
  id: string;
  yardNumber: string | null;
  boatName: string;
  boatType: string | null;
  boatNumber: string;
  bookings: { id: string; type: BookingType; status: BookingStatus; requestedAt: string }[];
};

export function DashboardClient({ userName, vessels }: { userName: string; vessels: VesselRow[] }) {
  const [bookingResult, setBookingResult] = React.useState<null | {
    vesselId: string;
    type: BookingType;
    position: number;
    queue: string[];
  }>(null);

  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  async function book(vesselId: string, type: BookingType) {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ vesselId, type }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Booking failed");
        return;
      }
      const data = (await res.json()) as { position: number; queue: string[]; booking: { type: BookingType } };
      setBookingResult({ vesselId, type, position: data.position, queue: data.queue });
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, {userName}</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Select a vessel and book a same-day launch or retrieval. After booking, you’ll see the live queue and your
          position.
        </p>
      </div>

      {error ? <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <Card>
        <CardHeader>
          <CardTitle>My vessels</CardTitle>
        </CardHeader>
        <CardContent>
          {vessels.length === 0 ? (
            <div className="text-sm text-zinc-600">No vessels yet. Register another vessel from your account.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-zinc-500">
                  <tr className="border-b border-zinc-200">
                    <th className="py-3 pr-4">Yard #</th>
                    <th className="py-3 pr-4">Boat</th>
                    <th className="py-3 pr-4">Type</th>
                    <th className="py-3 pr-4">Boat #</th>
                    <th className="py-3 pr-4">Today</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vessels.map((v) => {
                    const hasLaunch = v.bookings.some((b) => b.type === "LAUNCH");
                    const hasRetrieval = v.bookings.some((b) => b.type === "RETRIEVAL");
                    return (
                      <tr key={v.id} className="border-b border-zinc-100">
                        <td className="py-3 pr-4 font-medium">{v.yardNumber ?? "—"}</td>
                        <td className="py-3 pr-4">{v.boatName}</td>
                        <td className="py-3 pr-4 text-zinc-600">{v.boatType ?? "—"}</td>
                        <td className="py-3 pr-4 text-zinc-600">{v.boatNumber}</td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-wrap gap-2">
                            {hasLaunch ? <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs">Launch queued</span> : null}
                            {hasRetrieval ? <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs">Retrieval queued</span> : null}
                            {!hasLaunch && !hasRetrieval ? <span className="text-xs text-zinc-500">No bookings yet</span> : null}
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="secondary" disabled={pending} onClick={() => book(v.id, "LAUNCH")}>
                              Book launch
                            </Button>
                            <Button variant="secondary" disabled={pending} onClick={() => book(v.id, "RETRIEVAL")}>
                              Book retrieval
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {bookingResult ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="text-sm font-semibold">Booking confirmed</div>
          <div className="mt-1 text-sm text-zinc-600">
            Your position in the {bookingResult.type === "LAUNCH" ? "launch" : "retrieval"} queue is{" "}
            <span className="font-semibold text-zinc-900">#{bookingResult.position}</span>.
          </div>
          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Current queue (vessel IDs)</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {bookingResult.queue.slice(0, 50).map((id, i) => (
                <span key={i} className="rounded-full bg-zinc-100 px-3 py-1 text-xs">
                  {i + 1}. {id}
                </span>
              ))}
              {bookingResult.queue.length > 50 ? (
                <span className="text-xs text-zinc-500">…and {bookingResult.queue.length - 50} more</span>
              ) : null}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={`/queue/${bookingResult.type === "LAUNCH" ? "launch" : "retrieval"}`}>
              <Button>Open live queue</Button>
            </Link>
            <Button variant="ghost" onClick={() => setBookingResult(null)}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}


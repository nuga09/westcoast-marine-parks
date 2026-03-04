"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSocket } from "@/lib/socketClient";
import type { QueueResponseAdminDTO, QueueResponseCustomerDTO } from "@/lib/apiTypes";

type QueueType = "LAUNCH" | "RETRIEVAL";

export function QueueClient({ type, isAdmin }: { type: QueueType; isAdmin: boolean }) {
  const [data, setData] = React.useState<QueueResponseAdminDTO | QueueResponseCustomerDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionPendingId, setActionPendingId] = React.useState<string | null>(null);

  const title = type === "LAUNCH" ? "Launch queue" : "Retrieval queue";

  async function load() {
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/queues/${type}`, { cache: "no-store" });
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(j?.error ?? "Failed to load queue");
      setLoading(false);
      return;
    }
    const j = (await res.json()) as QueueResponseAdminDTO | QueueResponseCustomerDTO;
    setData(j);
    setLoading(false);
  }

  async function markCompleted(id: string) {
    if (!isAdmin) return;
    setActionPendingId(id);
    try {
      await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "MARK_COMPLETED" }),
      });
      await load();
    } finally {
      setActionPendingId(null);
    }
  }

  async function toggleMooring(id: string, stayingOnMooring: boolean) {
    if (!isAdmin) return;
    setActionPendingId(id);
    try {
      await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "SET_MOORING", stayingOnMooring }),
      });
      await load();
    } finally {
      setActionPendingId(null);
    }
  }

  React.useEffect(() => {
    load();
    let active = true;
    (async () => {
      const socket = await getSocket();
      if (!active) return;
      socket.emit("queues:subscribe", {});
      const onUpdated = () => load();
      socket.on("queues:updated", onUpdated);
      return () => {
        socket.off("queues:updated", onUpdated);
      };
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const pending = (
    isAdmin ? (data as QueueResponseAdminDTO | null)?.pending : (data as QueueResponseCustomerDTO | null)?.pending
  ) ?? [];
  const completed = (
    isAdmin ? (data as QueueResponseAdminDTO | null)?.completed : (data as QueueResponseCustomerDTO | null)?.completed
  ) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-zinc-600">Live queue for today. Updates automatically.</p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Daily message</div>
        <div className="mt-2 text-sm text-zinc-900">{data?.dailyMessage?.message ?? "—"}</div>
      </div>

      {error ? <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              Pending ({pending.length})
              {isAdmin ? <span className="ml-2 text-xs font-medium text-zinc-500">(staff view)</span> : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-zinc-600">Loading…</div>
            ) : pending.length === 0 ? (
              <div className="text-sm text-zinc-600">No pending requests.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-zinc-500">
                    <tr className="border-b border-zinc-200">
                      <th className="py-3 pr-4">#</th>
                      <th className="py-3 pr-4">Yard #</th>
                      {isAdmin ? <th className="py-3 pr-4">Boat</th> : null}
                      <th className="py-3 pr-4">Requested</th>
                      {isAdmin ? <th className="py-3 pr-4">Customer</th> : null}
                      {isAdmin ? <th className="py-3 text-right">Action</th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((b, i) => (
                      <tr key={b.id} className="border-b border-zinc-100">
                        <td className="py-3 pr-4 font-medium">{i + 1}</td>
                        <td className="py-3 pr-4 font-medium">{b.vessel?.yardNumber ?? "—"}</td>
                        {isAdmin ? <td className="py-3 pr-4">{(b as QueueResponseAdminDTO["pending"][number]).vessel.boatName}</td> : null}
                        <td className="py-3 pr-4 text-zinc-600">
                          {b.requestedAt ? new Date(b.requestedAt).toLocaleTimeString() : "—"}
                        </td>
                        {isAdmin ? (
                          <td className="py-3 pr-4 text-zinc-600">
                            {(b as QueueResponseAdminDTO["pending"][number]).vessel.owner.name}{" "}
                            <span className="text-xs text-zinc-500">
                              ({(b as QueueResponseAdminDTO["pending"][number]).vessel.owner.phone ?? "no phone"})
                            </span>
                          </td>
                        ) : null}
                        {isAdmin ? (
                          <td className="py-3 text-right">
                            <Button
                              variant="secondary"
                              disabled={actionPendingId === b.id}
                              onClick={() => markCompleted(b.id)}
                            >
                              {actionPendingId === b.id ? "Updating…" : type === "LAUNCH" ? "Mark launched" : "Mark retrieved"}
                            </Button>
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completed ({completed.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-zinc-600">Loading…</div>
            ) : completed.length === 0 ? (
              <div className="text-sm text-zinc-600">None completed yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-zinc-500">
                    <tr className="border-b border-zinc-200">
                      <th className="py-3 pr-4">Yard #</th>
                      {isAdmin ? <th className="py-3 pr-4">Boat</th> : null}
                      <th className="py-3 pr-4">Completed</th>
                      {type === "LAUNCH" ? <th className="py-3 pr-4">Mooring</th> : null}
                      {isAdmin && type === "LAUNCH" ? <th className="py-3 text-right">Action</th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {completed.map((b) => (
                      <tr key={b.id} className="border-b border-zinc-100">
                        <td className="py-3 pr-4 font-medium">{b.vessel?.yardNumber ?? "—"}</td>
                        {isAdmin ? <td className="py-3 pr-4">{(b as QueueResponseAdminDTO["completed"][number]).vessel.boatName}</td> : null}
                        <td className="py-3 pr-4 text-zinc-600">
                          {b.completedAt ? new Date(b.completedAt).toLocaleTimeString() : "—"}
                        </td>
                        {type === "LAUNCH" ? (
                          <td className="py-3 pr-4 text-zinc-600">{b.stayingOnMooring ? "Staying out" : "—"}</td>
                        ) : null}
                        {isAdmin && type === "LAUNCH" ? (
                          <td className="py-3 text-right">
                            <Button
                              variant={b.stayingOnMooring ? "secondary" : "ghost"}
                              disabled={actionPendingId === b.id}
                              onClick={() => toggleMooring(b.id, !b.stayingOnMooring)}
                            >
                              {actionPendingId === b.id
                                ? "Updating…"
                                : b.stayingOnMooring
                                  ? "Unset mooring"
                                  : "Tag mooring"}
                            </Button>
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


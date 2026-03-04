"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSocket } from "@/lib/socketClient";
import type { QueueResponseAdminDTO } from "@/lib/apiTypes";

type QueueType = "LAUNCH" | "RETRIEVAL";

function beep() {
  try {
    const w = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const AudioCtx = w.AudioContext ?? w.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.05;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    setTimeout(() => {
      o.stop();
      ctx.close();
    }, 140);
  } catch {
    // ignore
  }
}

export function TractorClient() {
  const [active, setActive] = React.useState<QueueType>("LAUNCH");
  const [launchData, setLaunchData] = React.useState<QueueResponseAdminDTO | null>(null);
  const [retrievalData, setRetrievalData] = React.useState<QueueResponseAdminDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const prevCounts = React.useRef<{ launch: number; retrieval: number }>({ launch: 0, retrieval: 0 });

  const loadAll = React.useCallback(async ({ allowBeep }: { allowBeep: boolean }) => {
    setError(null);
    setLoading(true);
    try {
      const fetchQueue = async (type: QueueType) => {
        const res = await fetch(`/api/queues/${type}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load");
        return (await res.json()) as QueueResponseAdminDTO;
      };

      const [l, r] = await Promise.all([fetchQueue("LAUNCH"), fetchQueue("RETRIEVAL")]);
      const lCount = l.pending.length;
      const rCount = r.pending.length;

      if (allowBeep) {
        if (lCount > prevCounts.current.launch || rCount > prevCounts.current.retrieval) beep();
      }

      prevCounts.current = { launch: lCount, retrieval: rCount };
      setLaunchData(l);
      setRetrievalData(r);
    } catch {
      setError("Failed to load queues");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAll({ allowBeep: false });
    let activeFlag = true;
    (async () => {
      const socket = await getSocket();
      if (!activeFlag) return;
      socket.emit("queues:subscribe", {});
      const onUpdated = () => loadAll({ allowBeep: true });
      socket.on("queues:updated", onUpdated);
      return () => socket.off("queues:updated", onUpdated);
    })();
    return () => {
      activeFlag = false;
    };
  }, [loadAll]);

  const data = active === "LAUNCH" ? launchData : retrievalData;
  const pending = data?.pending ?? [];

  async function markCompleted(id: string) {
    await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "MARK_COMPLETED" }),
    });
    await loadAll({ allowBeep: false });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tractor / Mobile Queue View</h1>
          <p className="mt-1 text-sm text-zinc-600">Switch queues, see pending counts, and mark as launched/retrieved.</p>
        </div>
        <Button variant="secondary" onClick={() => loadAll({ allowBeep: false })} disabled={loading}>
          Refresh
        </Button>
      </div>

      {error ? <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>{active === "LAUNCH" ? "Launch requests" : "Retrieval requests"}</CardTitle>
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
                      <th className="py-3 pr-4">Yard #</th>
                      <th className="py-3 pr-4">Boat</th>
                      <th className="py-3 pr-4">Time</th>
                      <th className="py-3 pr-4">Customer</th>
                      <th className="py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((b) => (
                      <tr key={b.id} className="border-b border-zinc-100">
                        <td className="py-3 pr-4 font-medium">{b.vessel?.yardNumber ?? "—"}</td>
                        <td className="py-3 pr-4">{b.vessel?.boatName ?? "—"}</td>
                        <td className="py-3 pr-4 text-zinc-600">
                          {b.requestedAt ? new Date(b.requestedAt).toLocaleTimeString() : "—"}
                        </td>
                        <td className="py-3 pr-4 text-zinc-600">
                          {b.vessel?.owner?.name ? (
                            <span>
                              {b.vessel.owner.name}{" "}
                              <span className="text-xs text-zinc-500">({b.vessel.owner.phone ?? "no phone"})</span>
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <Button variant="secondary" onClick={() => markCompleted(b.id)}>
                            {active === "LAUNCH" ? "Mark launched" : "Mark retrieved"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Menu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button variant={active === "LAUNCH" ? "primary" : "secondary"} onClick={() => setActive("LAUNCH")}>
                  Launch
                </Button>
                <Button
                  variant={active === "RETRIEVAL" ? "primary" : "secondary"}
                  onClick={() => setActive("RETRIEVAL")}
                >
                  Retrieval
                </Button>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Pending launches</span>
                  <span className="font-semibold">{launchData?.pending?.length ?? "—"}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-medium">Pending retrievals</span>
                  <span className="font-semibold">{retrievalData?.pending?.length ?? "—"}</span>
                </div>
              </div>

              <div className="text-xs text-zinc-600">
                Audible alert plays when a new launch/retrieval request is added.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


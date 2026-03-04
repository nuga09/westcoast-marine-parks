"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  vessels: {
    id: string;
    yardNumber: string | null;
    boatName: string;
    boatType: string | null;
    boatNumber: string;
  }[];
};

type VesselPatch = {
  yardNumber?: string;
  boatName?: string;
  boatType?: string;
  boatNumber?: string;
};

export function AdminClient({
  initialDailyMessage,
  customers,
}: {
  initialDailyMessage: {
    message: string;
    launchStartTime: string | null;
    retrievalStartTime: string | null;
    updatedAt: Date | null;
  };
  customers: Customer[];
}) {
  const [msg, setMsg] = React.useState(initialDailyMessage.message);
  const [launchStart, setLaunchStart] = React.useState(initialDailyMessage.launchStartTime ?? "");
  const [retrievalStart, setRetrievalStart] = React.useState(initialDailyMessage.retrievalStartTime ?? "");
  const [savingMsg, startSavingMsg] = React.useTransition();

  const [localCustomers, setLocalCustomers] = React.useState(customers);
  const [savingVesselId, setSavingVesselId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const vesselOptions = React.useMemo(() => {
    const opts: { vesselId: string; label: string }[] = [];
    for (const c of localCustomers) {
      for (const v of c.vessels) {
        opts.push({
          vesselId: v.id,
          label: `${v.yardNumber ?? "—"} · ${v.boatName} (${c.name})`,
        });
      }
    }
    return opts;
  }, [localCustomers]);

  const [manualVesselId, setManualVesselId] = React.useState(vesselOptions[0]?.vesselId ?? "");
  const [manualPending, startManual] = React.useTransition();
  const [manualResult, setManualResult] = React.useState<string | null>(null);

  async function saveDailyMessage() {
    setError(null);
    startSavingMsg(async () => {
      const res = await fetch("/api/admin/daily-message", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: msg, launchStartTime: launchStart, retrievalStartTime: retrievalStart }),
      });
      if (!res.ok) setError("Failed to save daily message");
    });
  }

  async function saveVessel(vesselId: string, patch: VesselPatch) {
    setError(null);
    setSavingVesselId(vesselId);
    try {
      const res = await fetch(`/api/admin/vessels/${vesselId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        setError("Failed to save vessel (yard number may already exist)");
        return;
      }
      const j = (await res.json()) as { vessel: { id: string; yardNumber: string | null; boatName: string; boatType: string | null; boatNumber: string } };
      setLocalCustomers((prev) =>
        prev.map((c) => ({
          ...c,
          vessels: c.vessels.map((v) => (v.id === j.vessel.id ? { ...v, ...j.vessel } : v)),
        })),
      );
    } finally {
      setSavingVesselId(null);
    }
  }

  async function manualBook(type: "LAUNCH" | "RETRIEVAL") {
    setManualResult(null);
    startManual(async () => {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ vesselId: manualVesselId, type }),
      });
      if (!res.ok) {
        setManualResult("Manual booking failed");
        return;
      }
      const j = (await res.json()) as { position: number };
      setManualResult(`Booked. Position in queue: #${j.position}`);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin panel</h1>
          <p className="mt-1 text-sm text-zinc-600">Manage daily message, customers/vessels, and manual bookings.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/office/launch">
            <Button variant="secondary">Office: Launch screen</Button>
          </Link>
          <Link href="/office/retrieval">
            <Button variant="secondary">Office: Retrieval screen</Button>
          </Link>
        </div>
      </div>

      {error ? <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <Card>
        <CardHeader>
          <CardTitle>Daily message banner (landing page)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Message</Label>
            <Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Tide & time info…" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Launch start time</Label>
              <Input value={launchStart} onChange={(e) => setLaunchStart(e.target.value)} placeholder="10:00" />
            </div>
            <div className="space-y-2">
              <Label>Retrieval start time</Label>
              <Input value={retrievalStart} onChange={(e) => setRetrievalStart(e.target.value)} placeholder="16:00" />
            </div>
          </div>
          <Button disabled={savingMsg} onClick={saveDailyMessage}>
            {savingMsg ? "Saving…" : "Save daily message"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual booking (quick add)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Vessel</Label>
            <select
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"
              value={manualVesselId}
              onChange={(e) => setManualVesselId(e.target.value)}
            >
              {vesselOptions.map((o) => (
                <option key={o.vesselId} value={o.vesselId}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" disabled={manualPending} onClick={() => manualBook("LAUNCH")}>
              Book launch
            </Button>
            <Button variant="secondary" disabled={manualPending} onClick={() => manualBook("RETRIEVAL")}>
              Book retrieval
            </Button>
          </div>
          {manualResult ? <div className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-800">{manualResult}</div> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customers & vessels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {localCustomers.length === 0 ? (
            <div className="text-sm text-zinc-600">No customers yet.</div>
          ) : (
            localCustomers.map((c) => (
              <div key={c.id} className="rounded-xl border border-zinc-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">{c.name}</div>
                    <div className="text-xs text-zinc-600">
                      {c.email}
                      {c.phone ? ` · ${c.phone}` : ""}
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  {c.vessels.map((v) => (
                    <div key={v.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                        <div className="space-y-1">
                          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Yard #</div>
                          <Input
                            value={v.yardNumber ?? ""}
                            onChange={(e) =>
                              setLocalCustomers((prev) =>
                                prev.map((x) =>
                                  x.id !== c.id
                                    ? x
                                    : { ...x, vessels: x.vessels.map((vv) => (vv.id === v.id ? { ...vv, yardNumber: e.target.value } : vv)) },
                                ),
                              )
                            }
                            placeholder="YD102"
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Boat name</div>
                          <Input
                            value={v.boatName}
                            onChange={(e) =>
                              setLocalCustomers((prev) =>
                                prev.map((x) =>
                                  x.id !== c.id
                                    ? x
                                    : { ...x, vessels: x.vessels.map((vv) => (vv.id === v.id ? { ...vv, boatName: e.target.value } : vv)) },
                                ),
                              )
                            }
                          />
                        </div>
                        <div className="flex items-end justify-end">
                          <Button
                            variant="secondary"
                            disabled={savingVesselId === v.id}
                            onClick={() =>
                              saveVessel(v.id, {
                                yardNumber: v.yardNumber ?? "",
                                boatName: v.boatName,
                                boatType: v.boatType ?? "",
                                boatNumber: v.boatNumber,
                              })
                            }
                          >
                            {savingVesselId === v.id ? "Saving…" : "Save"}
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-zinc-600">
                        Boat #: {v.boatNumber}
                        {v.boatType ? ` · Type: ${v.boatType}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}


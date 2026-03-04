"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type VesselDraft = {
  boatName: string;
  boatType: string;
  boatNumber: string;
  yardNumber: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [vessels, setVessels] = React.useState<VesselDraft[]>([
    { boatName: "", boatType: "", boatNumber: "", yardNumber: "" },
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              startTransition(async () => {
                const res = await fetch("/api/auth/register", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ name, phone, address, email, password, vessels }),
                });
                if (!res.ok) {
                  const data = (await res.json().catch(() => null)) as { error?: string } | null;
                  setError(data?.error ?? "Registration failed");
                  return;
                }
                router.push("/dashboard");
                router.refresh();
              });
            }}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Vessels</div>
                  <div className="text-xs text-zinc-600">Add multiple boats if applicable. Yard # can be left blank.</div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setVessels((prev) => [...prev, { boatName: "", boatType: "", boatNumber: "", yardNumber: "" }])
                  }
                >
                  + Add vessel
                </Button>
              </div>

              <div className="space-y-4">
                {vessels.map((v, idx) => (
                  <div key={idx} className="rounded-xl border border-zinc-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Vessel {idx + 1}</div>
                      {vessels.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setVessels((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          Remove
                        </Button>
                      ) : null}
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Boat name</Label>
                        <Input
                          value={v.boatName}
                          onChange={(e) =>
                            setVessels((prev) => prev.map((x, i) => (i === idx ? { ...x, boatName: e.target.value } : x)))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Boat type</Label>
                        <Input
                          value={v.boatType}
                          onChange={(e) =>
                            setVessels((prev) => prev.map((x, i) => (i === idx ? { ...x, boatType: e.target.value } : x)))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Boat number</Label>
                        <Input
                          value={v.boatNumber}
                          onChange={(e) =>
                            setVessels((prev) => prev.map((x, i) => (i === idx ? { ...x, boatNumber: e.target.value } : x)))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Yard number (optional)</Label>
                        <Input
                          value={v.yardNumber}
                          onChange={(e) =>
                            setVessels((prev) => prev.map((x, i) => (i === idx ? { ...x, yardNumber: e.target.value } : x)))
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button disabled={pending}>{pending ? "Creating…" : "Register"}</Button>
              <div className="text-sm text-zinc-600">
                Already have an account?{" "}
                <Link className="font-medium text-zinc-900 underline-offset-4 hover:underline" href="/login">
                  Login
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


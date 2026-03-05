"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams?.get("next") ?? "/dashboard";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                startTransition(async () => {
                  const res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ email, password }),
                  });
                  if (!res.ok) {
                    const data = (await res.json().catch(() => null)) as { error?: string } | null;
                    setError(data?.error ?? "Login failed");
                    return;
                  }
                  router.push(next);
                  router.refresh();
                });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

              <Button className="w-full" disabled={pending}>
                {pending ? "Signing in…" : "Sign in"}
              </Button>

              <div className="text-center text-sm text-zinc-600">
                New here?{" "}
                <Link className="font-medium text-zinc-900 underline-offset-4 hover:underline" href="/register">
                  Create an account
                </Link>
              </div>

              <div className="rounded-lg bg-zinc-50 p-3 text-xs text-zinc-700">
                <div className="font-semibold">Seed accounts (local)</div>
                <div className="mt-1">Admin: admin@westcoastmarine.local / Admin123!</div>
                <div>Customer: customer@westcoastmarine.local / Customer123!</div>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="relative hidden overflow-hidden rounded-2xl border border-zinc-200 bg-white lg:block">
          <Image
            src="/boat-hero.svg"
            alt=""
            aria-hidden="true"
            fill
            sizes="(max-width: 1024px) 0px, 560px"
            className="object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/0" />
          <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/40 bg-white/55 p-4 backdrop-blur">
            <div className="text-sm font-semibold text-zinc-900">Harbour access</div>
            <div className="mt-1 text-xs text-zinc-700">
              Sign in to view your vessels, book launches/retrievals, and follow the live queue.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


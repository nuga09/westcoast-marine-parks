import { Suspense } from "react";
import { LoginClient } from "@/app/login/login-client";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-zinc-600">Loading…</div>}>
      <LoginClient />
    </Suspense>
  );
}


"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import * as React from "react";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  return (
    <Button
      variant="ghost"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          router.refresh();
          router.push("/");
        });
      }}
    >
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}


import Link from "next/link";
import { getCurrentUser } from "@/lib/currentUser";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";

export async function NavBar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold text-zinc-900">
          Westcoast Marine · Park & Launch
        </Link>

        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-sm text-zinc-600 sm:inline">
                {user.name} ({user.role})
              </span>
              <Link href="/dashboard">
                <Button variant="secondary">Dashboard</Button>
              </Link>
              {user.role === "ADMIN" ? (
                <>
                  <Link href="/tractor">
                    <Button variant="secondary">Tractor View</Button>
                  </Link>
                  <Link href="/admin">
                    <Button variant="secondary">Admin</Button>
                  </Link>
                </>
              ) : null}
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="secondary">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Register</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}


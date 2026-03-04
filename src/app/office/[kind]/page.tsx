import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";
import { QueueClient } from "@/app/queue/queue-client";

export default async function OfficeScreen({ params }: { params: Promise<{ kind: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const { kind } = await params;
  const normalized = kind.toLowerCase();
  const type = normalized === "launch" ? "LAUNCH" : normalized === "retrieval" ? "RETRIEVAL" : null;
  if (!type) redirect("/admin");

  return <QueueClient type={type} isAdmin />;
}


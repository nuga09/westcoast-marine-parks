import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { startOfTodayLocal } from "@/lib/dates";
import { DashboardClient } from "@/app/dashboard/dashboard-client";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const serviceDate = startOfTodayLocal();

  const vessels = await db.vessel.findMany({
    where: { userId: user.id },
    orderBy: [{ yardNumber: "asc" }, { boatName: "asc" }],
    select: {
      id: true,
      yardNumber: true,
      boatName: true,
      boatType: true,
      boatNumber: true,
      bookings: {
        where: { serviceDate, status: "PENDING" },
        select: { id: true, type: true, status: true, requestedAt: true },
        orderBy: { requestedAt: "asc" },
      },
    },
  });

  const vesselsForClient = vessels.map((v) => ({
    ...v,
    bookings: v.bookings.map((b) => ({ ...b, requestedAt: b.requestedAt.toISOString() })),
  }));

  return <DashboardClient userName={user.name} vessels={vesselsForClient} />;
}


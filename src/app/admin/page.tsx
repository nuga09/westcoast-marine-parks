import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { startOfTodayLocal } from "@/lib/dates";
import { AdminClient } from "@/app/admin/admin-client";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const serviceDate = startOfTodayLocal();

  const dailyMessage = await db.dailyMessage.findUnique({
    where: { serviceDate },
    select: { message: true, launchStartTime: true, retrievalStartTime: true, updatedAt: true },
  });

  const customers = await db.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      vessels: {
        orderBy: [{ yardNumber: "asc" }, { boatName: "asc" }],
        select: { id: true, yardNumber: true, boatName: true, boatType: true, boatNumber: true },
      },
    },
  });

  return (
    <AdminClient
      initialDailyMessage={
        dailyMessage ?? {
          message: "",
          launchStartTime: null,
          retrievalStartTime: null,
          updatedAt: null,
        }
      }
      customers={customers}
    />
  );
}


import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const session = await verifySessionToken(token);
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true, phone: true, address: true, role: true },
    });
    return user;
  } catch {
    return null;
  }
}


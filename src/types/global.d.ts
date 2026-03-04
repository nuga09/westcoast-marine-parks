import type { PrismaClient } from "@prisma/client";
import type { Server as IOServer } from "socket.io";

declare global {
  var __prisma: PrismaClient | undefined;
  var __io: IOServer | undefined;
}

export {};


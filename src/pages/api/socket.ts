import type { NextApiRequest, NextApiResponse } from "next";
import { Server as IOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import type { Socket as NetSocket } from "net";

type WithSocketServer = {
  socket: NetSocket & {
    server: HTTPServer & {
      io?: IOServer;
    };
  };
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const anyRes = res as NextApiResponse & WithSocketServer;

  if (!anyRes.socket.server.io) {
    const io = new IOServer(anyRes.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
    });

    io.on("connection", (socket) => {
      socket.on("queues:subscribe", (payload: { serviceDate: string | null } | undefined) => {
        const room = payload?.serviceDate ? `queues:${payload.serviceDate}` : "queues:today";
        socket.join(room);
      });
    });

    anyRes.socket.server.io = io;
    globalThis.__io = io;
  }

  res.status(200).json({ ok: true });
}


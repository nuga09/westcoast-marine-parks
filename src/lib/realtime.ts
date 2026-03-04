export function localDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function emitQueuesUpdated(serviceDate: Date) {
  const io = globalThis.__io;
  if (!io) return;

  const key = localDateKey(serviceDate);
  io.to("queues:today").emit("queues:updated", { serviceDate: key });
  io.to(`queues:${key}`).emit("queues:updated", { serviceDate: key });
}


# Westcoast Marine · Park & Launch (Local Prototype)

Functional prototype based on the provided wireframe PDF:
- Customer registration/login
- Multiple vessels per customer (yard # optional; admin can populate later)
- Same-day launch/retrieval booking
- Live queues + position in queue
- Admin + tractor/mobile view with audible alert on new bookings
- Office screens for launch/retrieval
- Admin panel for daily message banner + vessel yard # edits + manual bookings

## Tech
- Next.js (App Router) + TypeScript + Tailwind
- Prisma + SQLite (local DB in `prisma/dev.db`)
- JWT session cookie auth (customer/admin roles)
- Socket.IO (real-time queue updates) via `src/pages/api/socket.ts`

## Run locally (recommended)

From this folder:

```bash
npm install
npm run dev:setup
```

Then open `http://localhost:3000`.

### Environment (`.env`)
- If you don't have a `.env` yet, `npm run dev:setup` will generate one for you.
- For local SQLite, `DATABASE_URL` should be `file:./dev.db` (resolved relative to `prisma/schema.prisma`).

### Seed accounts
- **Admin**: `admin@westcoastmarine.local` / `Admin123!`
- **Customer**: `customer@westcoastmarine.local` / `Customer123!`

## Key screens
- `/` Landing page with **admin-editable** daily message banner
- `/register` Customer registration (add multiple vessels)
- `/dashboard` Customer dashboard (book launch/retrieval)
- `/queue/launch` and `/queue/retrieval` Customer live queues
- `/tractor` Tractor/mobile staff queue view (switch launch/retrieval, mark launched/retrieved, audible alert)
- `/office/launch` and `/office/retrieval` Office display screens (pending + completed)
- `/admin` Admin panel (daily message, manual booking, customer/vessel yard # management)

## Notes
- Bookings are enforced as **same-day** (service date = today on the server).
- Set a real secret in `.env` (`JWT_SECRET`) if you use this beyond local testing.

# westcoast-marine.git-

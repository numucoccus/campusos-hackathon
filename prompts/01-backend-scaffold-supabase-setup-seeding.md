# Prompt 1 — Backend Scaffold + Supabase Setup + Seeding

```
Set up the backend for CampusOS inside a new `backend/` folder of this repo. Read `schema/schema.md` and the 5 JSON files in `data/` first — the database must follow those exact field names and types.

Requirements:
1. Node.js + Express project with this structure:
   backend/
   ├── routes/ (schedule.js, rooms.js, events.js, announcements.js, assignments.js, chat.js)
   ├── services/ (scheduleService.js, roomService.js, eventService.js, announcementService.js, assignmentService.js)
   ├── ai/ (agent.js, tools.js)
   ├── database/ (supabaseClient.js — creates and exports the Supabase client using SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env)
   ├── middleware/ (errorHandler.js, validate.js)
   ├── utils/ (errors.js — NotFoundError, ValidationError, ConflictError, UnauthorizedError)
   ├── scripts/ (seed.js)
   ├── .env.example, server.js, package.json
2. Generate a `backend/database/schema.sql` file I can paste into the Supabase SQL editor. Tables: schedules, rooms, room_bookings, events, event_registrations, announcements, assignments — matching schema/schema.md exactly (bookings/registrations become their own tables with FKs instead of nested arrays; keep the same field names like booking_id, booked_by, student_id). Add a unique constraint on room_bookings(room_id, date, start_time, end_time) to guard against double-booking.
3. Write `scripts/seed.js` that reads the 5 JSON files from `../data/` and upserts them into Supabase (splitting rooms.bookings into room_bookings and events.registrations into event_registrations). It must be idempotent (safe to run twice).
4. server.js: express + cors + json body parsing, mounts all routes under /api, uses errorHandler last, listens on PORT from .env (default 3001). Add a GET /api/health endpoint.
5. .env.example must list: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY (or OPENAI_API_KEY), PORT. Never commit real keys; ensure .gitignore covers backend/.env.
For now routes/services/ai files can be empty stubs that export placeholders — they'll be implemented next. Install dependencies (express, cors, dotenv, @supabase/supabase-js, zod) and verify `node server.js` starts and /api/health responds.
```

> **Manual step after this prompt:** create a free Supabase project, paste `schema.sql` into the SQL editor, copy the URL + service role key into `backend/.env`, then run `node scripts/seed.js`.

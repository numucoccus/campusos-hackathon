# CampusOS — AI-Powered Campus Platform

> AI Build Hackathon submission. A two-part university platform: a live campus data dashboard + an AI agent that reads and acts on the **current** data through real tool calling.

## Project Overview

CampusOS keeps a student's scattered campus information — class schedules, rooms, events, announcements, and assignment deadlines — in one place. Part 1 is a full CRUD dashboard for all five systems, backed by a Supabase PostgreSQL database that is the single source of truth. Part 2 is an AI assistant (Groq LLM with genuine function calling) whose every tool call goes through the **exact same service layer** as the REST API, so a change made in the dashboard one second ago is what the agent answers from the next second. The agent answers questions across systems, books rooms after checking conflicts, registers for events, asks clarifying questions on vague requests, and refuses unauthorized actions (enforced in code, not just in the prompt).

## Architecture

```
        Next.js frontend (dashboard + chat UI)
                        │  REST
                        ▼
              Express backend (/api)
            ┌───────────┴───────────┐
        Routes                  AI Agent (Groq, tool calling)
            │                       │ tools.js — thin wrappers
            └───────────┬───────────┘
                    Services          ← ONE shared layer: validation,
              (business logic, auth,     conflict checks, ownership rules
               conflict detection)
                        │
                        ▼
              Supabase PostgreSQL     ← single source of truth
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React, TypeScript |
| Styling / UX | Tailwind CSS v4, Framer Motion, Lucide icons, dark & light themes |
| Backend | Node.js + Express |
| Validation | Zod (shared by REST routes and AI tools) |
| Database | Supabase (PostgreSQL) with constraint-level double-booking guard |
| Authentication | Supabase Auth (user store) + **JWT** (jsonwebtoken) for API access |
| AI | Groq — `openai/gpt-oss-120b` with native function/tool calling |

## Setup Instructions

Prerequisites: **Node.js 20+**, a free [Supabase](https://supabase.com) project, a free [Groq](https://console.groq.com) API key.

### 1. Database (Supabase)

1. Create a Supabase project.
2. Open the **SQL Editor**, paste the entire contents of [`backend/database/schema.sql`](./backend/database/schema.sql), and run it.
3. From **Project Settings → API**, copy the **Project URL** and the **service_role key**.

### 2. Backend

```bash
cd backend
npm install
copy .env.example .env      # (cp on macOS/Linux) then fill in the values below
npm run seed                # loads the 5 JSON seed files from ../data into Supabase
npm start                   # → http://localhost:3001  (health: /api/health)
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                 # → http://localhost:3000
```

Open http://localhost:3000 — the dashboard and the AI assistant are ready.

## Environment Variables

All backend variables go in `backend/.env` (see [`backend/.env.example`](./backend/.env.example)). **Never commit real keys.**

| Key | Where | Description |
|---|---|---|
| `SUPABASE_URL` | backend/.env | Supabase project URL (`https://xxxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | backend/.env | Supabase service role key (server-side only) |
| `GROQ_API_KEY` | backend/.env | Groq API key for the AI agent |
| `JWT_SECRET` | backend/.env | Secret used to sign JWT auth tokens (any long random string) |
| `PORT` | backend/.env | Backend port (default `3001`) |
| `NEXT_PUBLIC_API_URL` | frontend/.env.local (optional) | Backend API base, default `http://localhost:3001/api` |

## How to Use the Agent

Open **AI Assistant** in the sidebar (or the floating bot button). It works from live data on every request. Try:

- "When is my next class?" — reads the timetable *and* checks announcements for reschedules
- "What assignments do I have due this week?"
- "Show me all high priority announcements."
- "Which labs have a projector and can fit at least 30 people?"
- "Book Room 7A02 tomorrow from 3 PM to 5 PM." — checks conflicts (classes + bookings), then books
- "I need a room for 5 people with a projector, tomorrow between 2 and 4."
- "Register me for the Guest Lecture on Deep Learning."
- "Just book me any room tomorrow afternoon." — deliberately vague: the agent asks before acting
- "Cancel the CS department's booking." — refused: you can only cancel your own bookings

Edit anything in the dashboard, then ask the agent about it — it answers from the updated data immediately.

## Accounts & JWT Authentication

CampusOS uses **JWT-based authentication**:

- **/register** — create an account (name, student ID, email, password)
- **/login** — sign in; the server verifies the password (Supabase Auth stores users with secure hashing) and returns a **signed JWT** (`jsonwebtoken`, 7-day expiry) with your identity claims
- **/profile** — your info, your room bookings, and your event registrations (cancel from here)

How it works:

- The JWT is stored client-side and sent as `Authorization: Bearer <token>` on **every** API request.
- Backend middleware verifies the token on each request (`optionalAuth` globally; `requireAuth` protects `/api/auth/me`). Invalid/expired tokens are rejected with **401**.
- When you are signed in, room bookings, event registrations, and AI-agent actions use your **server-trusted JWT identity** — a client cannot spoof `booked_by` or the registrant, and you can only cancel your own bookings/registrations.
- Without an account the app still works as a demo user (`Dhrubo`, `20-40532`), so judges can use everything with zero setup.

## Project Structure

```
backend/
├── routes/        REST endpoints (schedules, rooms, events, announcements, assignments, chat)
├── services/      Business logic — the ONLY layer that touches Supabase
├── ai/            agent.js (tool-calling loop) + tools.js (wrappers over services)
├── validation/    Zod schemas shared by routes and AI tools
├── middleware/    validate.js, errorHandler.js
├── database/      supabaseClient.js + schema.sql
├── utils/         custom error classes, date/time helpers
└── scripts/       seed.js, smokeTest.js, apiTest.js, agentTest.js

frontend/
├── app/           pages: dashboard, schedule, rooms, events, announcements, assignments, assistant, login, register, profile
├── components/    Shell (nav), ui.tsx (design system), Toast, ThemeToggle
└── lib/           typed API client + shared types + auth state

data/              hackathon seed JSON (loaded into Supabase by npm run seed)
schema/            hackathon schema reference
```

## Hackathon Docs

- [Problem statement](./PROBLEM_STATEMENT.md) · [Schema](./schema/schema.md) · [Sample queries](./sample_queries/sample_queries.md) · [Submission guide](./SUBMISSION.md)

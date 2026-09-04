# CampusOS

## Project Overview

CampusOS is an intelligent university platform with two parts that share one live database. The **dashboard** lets you view and fully manage (add, edit, delete) five campus systems — class schedules, rooms, events, announcements, and assignments — with extra actions for booking rooms and registering for events. The **AI agent** sits on top of the same data and uses real LLM tool/function calling to answer questions and take actions (book a room after checking conflicts, register for an event, look things up across systems), always reading the current backend state so any change made in the dashboard is reflected instantly. Access is protected by JWT authentication: users register/sign in, and their identity is used for every booking, registration, and agent action.

## Tech Stack

- **Frontend:** Next.js (App Router) + React + TypeScript, Tailwind CSS, Framer Motion, Lucide icons
- **Backend:** Node.js + Express, Zod validation
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (user store) + JWT (`jsonwebtoken`)
- **LLM:** Groq — `openai/gpt-oss-120b` with function/tool calling

## Setup Instructions

Prerequisites: Node.js 20+, a free [Supabase](https://supabase.com) project, and a free [Groq](https://console.groq.com) API key.

**1. Database**
- In your Supabase project, open the **SQL Editor** and run the contents of [`backend/database/schema.sql`](./backend/database/schema.sql).
- From **Project Settings → API**, copy the Project URL and the `service_role` key.

**2. Backend**
```bash
cd backend
npm install
cp .env.example .env      # then fill in the values (see below)
npm run seed              # loads the seed data from ../data into Supabase
npm start                 # runs on http://localhost:3001
```

**3. Frontend**
```bash
cd frontend
npm install
npm run dev               # runs on http://localhost:3000
```

Open http://localhost:3000, click **Get Started**, create an account, and you're in.

## Environment Variables

Set these in `backend/.env` (see [`backend/.env.example`](./backend/.env.example)). Do not commit real keys.

| Key | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL (`https://xxxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `GROQ_API_KEY` | Groq API key for the AI agent |
| `JWT_SECRET` | Any long random string used to sign auth tokens |
| `PORT` | Backend port (optional, default `3001`) |

Frontend (optional, in `frontend/.env.local`): `NEXT_PUBLIC_API_URL` — backend API base, default `http://localhost:3001/api`.

## How to Use the Agent

Open **AI Assistant** from the sidebar (or the floating button). Ask natural questions like:

- "When is my next class?"
- "What assignments do I have due this week?"
- "Show me all high priority announcements."
- "Which labs have a projector and can fit at least 30 people?"
- "Book Room 7A02 tomorrow from 3 PM to 5 PM."
- "Register me for the Guest Lecture on Deep Learning."

The agent reads live data on every request, asks for clarification when a request is vague, and refuses actions on other users' data.

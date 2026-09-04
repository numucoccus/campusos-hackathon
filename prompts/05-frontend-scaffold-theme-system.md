# Prompt 5 — Frontend Scaffold + Theme System

```
Create the CampusOS frontend in a `frontend/` folder: Next.js (App Router) + React + Tailwind CSS + Framer Motion + Lucide icons. It talks ONLY to the Express API at http://localhost:3001/api (configurable via NEXT_PUBLIC_API_URL).

1. Scaffold with create-next-app (TypeScript, Tailwind, App Router, no src dir is fine).
2. Design system with dark AND light themes via a class-based theme toggle (persisted in localStorage, respects system preference on first load, no flash of wrong theme):
   - Dark theme: NOT too dark — use a soft slate/indigo palette (e.g. background #0f1420–#151b2c range, elevated cards, subtle borders, gentle glow accents). Never pure black.
   - Light theme: warm off-white background, high readability, and layout proportions following the golden ratio (~1.618) — e.g. sidebar-to-content ratio, card aspect ratios, spacing scale, hero section split.
   - Define all colors as CSS variables consumed by Tailwind so both themes share components.
3. App shell: fixed sidebar navigation (Dashboard, Schedule, Rooms, Events, Announcements, Assignments, AI Assistant) with Lucide icons + active state, topbar with app name, theme toggle, and current date/day. Smooth Framer Motion page transitions. Fully responsive (sidebar collapses to a bottom bar or drawer on mobile).
4. lib/api.ts: typed fetch helpers for every backend endpoint (all resources CRUD + book/cancel/register + chat).
5. Shared UI components: Card, Button, Badge (priority/status colors), Modal (animated), Input/Select/TextArea, Skeleton loader, Toast notifications, EmptyState.
6. A Dashboard home page with animated stat cards (counts of classes today, upcoming events, pending assignments, active announcements — fetched live) and a "high priority announcements" strip.
Verify `npm run dev` renders the shell with working theme toggle in both themes.
```

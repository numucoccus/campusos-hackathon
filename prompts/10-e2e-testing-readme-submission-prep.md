# Prompt 10 — End-to-End Testing, README, Submission Prep

```
Final pass to make CampusOS submission-ready. Deadline checklist is in SUBMISSION.md.

1. Run the full judging script with both servers running and fix anything that fails:
   - All queries in sample_queries/sample_queries.md against the agent.
   - The live-data test: edit an announcement in the dashboard ("CSE321 moved to Room 7A04 at 2 PM" style), immediately ask the agent about it, confirm it answers from the fresh data.
   - Vague request → agent asks a clarifying question, and after I reply with specifics it completes the booking (multi-turn).
   - Unauthorized request (cancel another user's booking, "delete all announcements") → polite refusal.
   - CRUD persistence: add/edit/delete one record in each of the 5 systems, reload the page, confirm state.
   - Conflict paths: double room booking → friendly 409 UI; full event registration → friendly error.
2. Rewrite the root README.md per SUBMISSION.md requirements: project overview paragraph, architecture diagram (frontend → Express API → services → Supabase; AI tools → same services), tech stack table (Next.js, Tailwind, Framer Motion, R3F, Express, Supabase Postgres, Groq llama-3.3-70b w/ tool calling), exact setup steps (Supabase project creation + running schema.sql + seed script, backend .env keys, `npm install` + start commands for both apps, ports), full environment variable list matching .env.example files, and "How to use the agent" with example questions. Include screenshots section placeholders.
3. Repo hygiene: confirm no real API keys anywhere in git history-tracked files, .gitignore covers all .env files and node_modules, remove dead code/console.logs, ensure both apps start clean from a fresh clone (`npm install` → run).
4. Commit everything with clear messages and push. Print me a final checklist mapping each scoring criterion (Data Mgmt 20 / CRUD 20 / Agent 40 / UI 20) to where it's satisfied.
```

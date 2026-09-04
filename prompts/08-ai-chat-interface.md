# Prompt 8 — AI Chat Interface

```
Build the AI Assistant page at /assistant in `frontend/`, wired to POST /api/chat.

1. Polished chat UI: message bubbles (user right, agent left with a CampusOS avatar), Framer Motion message entrance, animated typing indicator while awaiting reply, auto-scroll, multiline input with Enter-to-send / Shift+Enter newline.
2. Maintain conversation history client-side and send the full messages array each request (enables multi-turn clarification flows like the vague-booking case).
3. Show a subtle "tool activity" line under agent replies using the toolCalls returned by the backend (e.g. "🔧 checked room availability · booked room") — this visibly proves real tool calling to judges.
4. Suggested-prompt chips above the input for the judging queries: "When is my next class?", "What's due this week?", "Show high priority announcements", "Which labs have a projector and fit 30+?", "Book Room 7A02 tomorrow 3–5 PM", "Register me for the Deep Learning guest lecture".
5. Markdown rendering for agent replies (lists, bold). Error toast + retry option if the request fails. A "New chat" button that clears history.
6. Also add a floating chat launcher button visible on all dashboard pages that opens the assistant.
Verify the full loop in the browser: ask "When is my next class?", then edit that schedule entry in the dashboard, ask again, and confirm the agent's answer reflects the edit (live-data proof).
```

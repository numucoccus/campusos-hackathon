# Prompt 4 — AI Agent with Real Tool Calling

```
Implement the AI agent in `backend/ai/` using Groq (model: llama-3.3-70b-versatile via the openai-compatible SDK) — API key from GROQ_API_KEY. The agent must use REAL function/tool calling (judges disqualify prompt chaining), and every tool must call the existing service functions so the agent always reads live Supabase data — never cache anything.

1. ai/tools.js — define tool schemas + handlers (thin wrappers over services, validate inputs with the existing Zod schemas):
   get_schedules, get_rooms, find_available_rooms, check_room_availability, book_room, cancel_booking, get_events, register_for_event, cancel_event_registration, get_announcements, get_assignments, create_announcement, update_assignment_status.
2. ai/agent.js — runAgent(messages, user): calls the LLM with tools, executes requested tool calls, feeds results back, loops (max 6 iterations) until a final text answer. Support multi-turn conversation history passed in from the client.
3. System prompt must include (computed fresh per request): current date, time, and weekday in Asia/Dhaka; "university week runs Sunday–Thursday"; the current user identity (name + student_id, default demo user "Dhrubo", "20-40532"); behavioral rules:
   - ALWAYS fetch data with tools before answering — never answer from memory.
   - Before booking a room, check availability; before registering, check capacity.
   - If a request is vague (e.g. "book me any room tomorrow afternoon" — missing exact time/room/capacity), ask a clarifying question instead of acting.
   - REFUSE actions on other users' data (cancelling someone else's booking/registration), and refuse destructive bulk actions ("delete all announcements"). Politely explain why.
   - Answer concisely, format times as 12h for readability.
4. routes/chat.js: POST /api/chat with {messages: [{role, content}]} → returns {reply, toolCalls (names only, for a UI activity indicator)}.
5. Test via curl and show me answers for: "When is my next class?", "What assignments are due this week?", "Which labs have a projector and fit at least 30 people?", "Book Room 7A02 tomorrow from 3 PM to 5 PM", "Just book me any room tomorrow afternoon" (must ask, not act), "Cancel the CS department's booking" (must refuse).
```

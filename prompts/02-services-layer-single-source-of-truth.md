# Prompt 2 — Services Layer (the single source of truth)

```
Implement the full service layer in `backend/services/`. This layer is the ONLY code that touches Supabase (via `database/supabaseClient.js`). Both the REST routes and the AI tools will call these same functions later — never duplicate logic elsewhere. Read `schema/schema.md` for exact fields.

Implement:
1. scheduleService.js: getAll(filters: {day, course, room}), getById, create, update, delete.
2. roomService.js: getAll(filters: {type, minCapacity, equipment, status}), getById, create, update, delete, getBookings(roomId), checkAvailability(roomNumber, date, start_time, end_time) — must check overlapping room_bookings AND class schedules occupying that room on that weekday, bookRoom({room_number, date, start_time, end_time, booked_by, purpose}) — validates availability first, throws ConflictError with a helpful message if taken, cancelBooking(booking_id, requested_by) — throws UnauthorizedError if requested_by doesn't match booked_by, findAvailableRooms({date, start_time, end_time, minCapacity, equipment}) — for queries like "room for 5 people with a projector tomorrow 2-4".
3. eventService.js: getAll, getById, create, update, delete, register(eventId, {student_id, name}) — reject if event full (registered >= capacity), already registered, or status is cancelled/completed; increment `registered` count atomically, cancelRegistration(eventId, student_id) — only removes that student's own registration; decrement count.
4. announcementService.js: getAll(filters: {priority, activeOnly}) where activeOnly excludes expired (expires < today), getById, create, update, delete.
5. assignmentService.js: getAll(filters: {course, status, dueBefore, dueAfter}), getById, create, update, delete, plus getDueThisWeek(referenceDate).
Rules: all times "HH:MM" 24h, all dates "YYYY-MM-DD", university week is Sunday–Thursday. Every mutation returns the full updated record. Throw the custom errors from utils/errors.js — never return raw Supabase errors. Overlap logic: two ranges overlap when startA < endB AND startB < endA.
Write a small `backend/scripts/smokeTest.js` that calls each read function and prints counts, and run it to verify everything works against the live Supabase DB.
```

# Prompt 3 — REST Routes + Validation + Error Handling

```
Implement the Express REST API in `backend/routes/` on top of the existing services (services are the only DB access — routes just parse/validate/delegate).

1. middleware/validate.js: takes a Zod schema and validates req.body, throwing ValidationError with field details.
2. Zod schemas for each resource matching schema/schema.md exactly (create + partial update variants). Times must match /^\d{2}:\d{2}$/, dates /^\d{4}-\d{2}-\d{2}$/, day must be Sunday–Thursday, priority high|medium|low, room type classroom|lab|seminar, assignment status pending|submitted|graded|late.
3. Routes (all under /api):
   - schedules: GET / (with query filters), GET /:id, POST /, PUT /:id, DELETE /:id
   - rooms: same CRUD + GET /availability?room_number=&date=&start=&end=, GET /available?date=&start=&end=&minCapacity=&equipment=, POST /:roomNumber/book, DELETE /bookings/:bookingId (body: requested_by)
   - events: same CRUD + POST /:id/register, DELETE /:id/register/:studentId
   - announcements, assignments: full CRUD with query filters
4. middleware/errorHandler.js: maps custom errors → status codes (ValidationError 400, UnauthorizedError 403, NotFoundError 404, ConflictError 409, else 500) with JSON {error, details}. All route handlers use an async wrapper so thrown errors reach it.
5. Verify with curl: list each resource, create+update+delete a test announcement, attempt a double room booking (expect 409), register for a full event (expect 409). Show me the results.
```

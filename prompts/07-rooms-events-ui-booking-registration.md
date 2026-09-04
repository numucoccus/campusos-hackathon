# Prompt 7 — Rooms + Events UI (booking & registration)

```
Build the remaining two systems in `frontend/`, including their special actions.

1. /rooms page:
   - Grid of room cards grouped by wing (7A classrooms / 7B labs / 7C seminar halls) showing room_number, type, capacity, floor, status, equipment as icon chips (projector, AC, whiteboard, computers...).
   - Filters: type, min capacity, equipment, availability.
   - Room detail modal/drawer: full info + bookings list + "Book this room" form (date, start, end, booked_by, purpose) → calls POST book endpoint; show a clear conflict message on 409. Cancel booking button on each booking (sends requested_by; show the 403 message if not owner).
   - A "Find a room" panel: date + time range + capacity + equipment → calls the available-rooms endpoint and lists matches with one-click book.
2. /events page:
   - Event cards with name, description, date/time, venue, organizer, status badge, and an animated capacity bar (registered/capacity).
   - Register modal (student_id + name) → live count update; handle full/duplicate errors gracefully. Cancel-registration option. View registrations list in a detail drawer.
   - Full add/edit/delete for events too.
3. Update the Dashboard home page cards to link into these pages.
Everything must reflect changes instantly and survive reload. Verify: book a room, try booking the same slot again (see conflict UI), register for an event until full, cancel a registration.
```

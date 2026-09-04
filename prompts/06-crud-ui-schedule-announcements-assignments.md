# Prompt 6 — CRUD UI: Schedule, Announcements, Assignments

```
Build the full management UI in `frontend/` for three systems, using the existing api helpers and shared components. Every add/edit/delete must update the UI immediately without manual refresh (optimistic update or refetch after mutation) and persist via the backend.

1. /schedule page: weekly timetable grid (columns Sunday–Thursday, rows by time) plus a list view toggle. Each class card shows course, title, time, room, instructor, section. Add/Edit via modal form (validated: day restricted to Sun–Thu, HH:MM times, end > start). Delete with confirm dialog. Filter by day/course.
2. /announcements page: notice board layout, cards color-coded by priority (high/medium/low badges), showing title, body, posted_by, date, expiry; visually mark expired ones. Full add/edit/delete with modal forms. Filter by priority and active/expired.
3. /assignments page: cards or table grouped/sortable by deadline with status badges (pending/submitted/graded/late), a "due this week" highlight, days-remaining indicator (overdue in red). Full add/edit/delete + quick status-change dropdown. Filter by course and status.
Polish: Framer Motion enter/exit animations on list items and modals, skeletons while loading, toasts on success/error (surface backend error messages), empty states. Verify each system end-to-end: create, edit, delete, then reload the page to confirm persistence.
```

-- CampusOS schema for Supabase (PostgreSQL)
-- Paste this whole file into the Supabase SQL editor and run it.
-- Matches schema/schema.md exactly; nested bookings/registrations become child tables.

-- Drop in dependency order so the script is safe to re-run.
drop table if exists room_bookings;
drop table if exists event_registrations;
drop table if exists schedules;
drop table if exists rooms;
drop table if exists events;
drop table if exists announcements;
drop table if exists assignments;

-- 1. Schedules
create table schedules (
  id         text primary key,
  course     text not null,
  title      text not null,
  day        text not null check (day in ('Sunday','Monday','Tuesday','Wednesday','Thursday')),
  start_time text not null check (start_time ~ '^\d{2}:\d{2}$'),
  end_time   text not null check (end_time ~ '^\d{2}:\d{2}$'),
  room       text not null,
  instructor text not null default 'TBA',
  section    text not null,
  created_at timestamptz not null default now()
);

-- 2. Rooms
create table rooms (
  id          text primary key,
  room_number text not null unique,
  type        text not null check (type in ('classroom','lab','seminar')),
  capacity    integer not null check (capacity > 0),
  equipment   text[] not null default '{}',
  floor       integer not null,
  status      text not null default 'available' check (status in ('available','unavailable')),
  created_at  timestamptz not null default now()
);

-- 2b. Room bookings (was rooms.bookings[])
create table room_bookings (
  booking_id text primary key,
  room_id    text not null references rooms(id) on delete cascade,
  booked_by  text not null,
  date       text not null check (date ~ '^\d{4}-\d{2}-\d{2}$'),
  start_time text not null check (start_time ~ '^\d{2}:\d{2}$'),
  end_time   text not null check (end_time ~ '^\d{2}:\d{2}$'),
  purpose    text not null default '',
  created_at timestamptz not null default now(),
  -- DB-level guard against booking the exact same slot twice.
  constraint uq_room_slot unique (room_id, date, start_time, end_time)
);

-- 3. Events
create table events (
  id          text primary key,
  name        text not null,
  description text not null default '',
  date        text not null check (date ~ '^\d{4}-\d{2}-\d{2}$'),
  start_time  text not null check (start_time ~ '^\d{2}:\d{2}$'),
  end_time    text not null check (end_time ~ '^\d{2}:\d{2}$'),
  end_date    text not null check (end_date ~ '^\d{4}-\d{2}-\d{2}$'),
  venue       text not null,
  organizer   text not null,
  capacity    integer not null check (capacity > 0),
  registered  integer not null default 0 check (registered >= 0),
  status      text not null default 'upcoming'
              check (status in ('upcoming','ongoing','completed','cancelled','full')),
  created_at  timestamptz not null default now()
);

-- 3b. Event registrations (was events.registrations[])
create table event_registrations (
  id         bigint generated always as identity primary key,
  event_id   text not null references events(id) on delete cascade,
  student_id text not null,
  name       text not null,
  created_at timestamptz not null default now(),
  constraint uq_event_student unique (event_id, student_id)
);

-- 4. Announcements
create table announcements (
  id         text primary key,
  title      text not null,
  body       text not null,
  date       text not null check (date ~ '^\d{4}-\d{2}-\d{2}$'),
  priority   text not null check (priority in ('high','medium','low')),
  posted_by  text not null,
  expires    text not null check (expires ~ '^\d{4}-\d{2}-\d{2}$'),
  created_at timestamptz not null default now()
);

-- 5. Assignments
create table assignments (
  id                  text primary key,
  course              text not null,
  course_title        text not null,
  title               text not null,
  description         text not null default '',
  assigned_date       text not null check (assigned_date ~ '^\d{4}-\d{2}-\d{2}$'),
  deadline            text not null check (deadline ~ '^\d{4}-\d{2}-\d{2}$'),
  submission_platform text not null,
  status              text not null default 'pending'
                      check (status in ('pending','submitted','graded','late')),
  marks               integer not null check (marks >= 0),
  created_at          timestamptz not null default now()
);

-- Helpful indexes for common agent/dashboard queries
create index idx_schedules_day on schedules(day);
create index idx_schedules_room on schedules(room);
create index idx_bookings_room_date on room_bookings(room_id, date);
create index idx_events_date on events(date);
create index idx_assignments_deadline on assignments(deadline);
create index idx_announcements_priority on announcements(priority);

-- RLS: enabled on all tables. The Express backend uses the service role key
-- (which bypasses RLS); authorization rules are enforced in the service layer.
alter table schedules enable row level security;
alter table rooms enable row level security;
alter table room_bookings enable row level security;
alter table events enable row level security;
alter table event_registrations enable row level security;
alter table announcements enable row level security;
alter table assignments enable row level security;

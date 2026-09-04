'use client';
import { api, fmt12h, fmtDate } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Announcement, Assignment, CampusEvent, Room, Schedule } from '@/lib/types';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, ClipboardList, DoorOpen, PartyPopper } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge, Card, Skeleton } from '@/components/ui';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

export default function Dashboard() {
  const { identity } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[] | null>(null);
  const [events, setEvents] = useState<CampusEvent[] | null>(null);
  const [assignments, setAssignments] = useState<Assignment[] | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  const [rooms, setRooms] = useState<Room[] | null>(null);

  useEffect(() => {
    api.schedules.list().then(setSchedules).catch(() => setSchedules([]));
    api.events.list().then(setEvents).catch(() => setEvents([]));
    api.assignments.list().then(setAssignments).catch(() => setAssignments([]));
    api.announcements.list({ activeOnly: true }).then(setAnnouncements).catch(() => setAnnouncements([]));
    api.rooms.list().then(setRooms).catch(() => setRooms([]));
  }, []);

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayClasses = schedules?.filter((s) => s.day === todayName) ?? null;
  const upcomingEvents = events?.filter((e) => ['upcoming', 'ongoing', 'full'].includes(e.status)) ?? null;
  const pendingAssignments = assignments?.filter((a) => a.status === 'pending') ?? null;
  const highPriority = announcements?.filter((a) => a.priority === 'high') ?? null;
  const availableRooms = rooms?.filter((r) => r.status === 'available').sort((a, b) => a.room_number.localeCompare(b.room_number)) ?? null;

  const stats = [
    { label: DAYS.includes(todayName) ? 'Classes today' : 'Classes today (weekend)', value: todayClasses?.length, icon: CalendarDays, href: '/schedule' },
    { label: 'Available rooms', value: availableRooms?.length, icon: DoorOpen, href: '/rooms' },
    { label: 'Upcoming events', value: upcomingEvents?.length, icon: PartyPopper, href: '/events' },
    { label: 'Pending assignments', value: pendingAssignments?.length, icon: ClipboardList, href: '/assignments' },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Welcome back, {identity.name.split(' ')[0]} 👋</h1>
        <p className="mt-1 text-sm text-muted">Here is what is happening on campus right now — all data is live.</p>
      </motion.div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Link href={href}>
              <Card className="group hover:border-accent/50">
                <div className="flex items-center justify-between">
                  <Icon size={20} className="text-accent" />
                  <ArrowRight size={16} className="text-muted opacity-0 transition group-hover:opacity-100" />
                </div>
                {value === undefined || value === null ? (
                  <Skeleton className="mt-3 h-8 w-14" />
                ) : (
                  <div className="mt-3 text-3xl font-bold">{value}</div>
                )}
                <div className="mt-1 text-xs text-muted">{label}</div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Available rooms */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><DoorOpen size={18} className="text-accent" /> Available rooms</h2>
          <Link href="/rooms" className="text-xs font-medium text-accent hover:underline">Manage rooms</Link>
        </div>
        <Card>
          {availableRooms === null ? (
            <div className="flex flex-wrap gap-2">
              {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-9 w-16" />)}
            </div>
          ) : availableRooms.length === 0 ? (
            <p className="text-sm text-muted">No rooms are currently available.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableRooms.map((r) => (
                <Link
                  key={r.id}
                  href="/rooms"
                  className="group inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-1.5 text-sm font-semibold transition hover:border-accent/50 hover:text-accent"
                  title={`${r.type} · capacity ${r.capacity}`}
                >
                  {r.room_number}
                  <span className="text-[11px] font-normal text-muted">· {r.capacity}</span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </motion.section>

      {/* High priority strip */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">High priority notices</h2>
          <Link href="/announcements" className="text-xs font-medium text-accent hover:underline">View all</Link>
        </div>
        {highPriority === null ? (
          <div className="grid gap-3 md:grid-cols-2">
            <Skeleton className="h-24" /><Skeleton className="h-24" />
          </div>
        ) : highPriority.length === 0 ? (
          <Card><p className="text-sm text-muted">No high priority announcements right now. 🎉</p></Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {highPriority.slice(0, 4).map((a) => (
              <Card key={a.id} className="border-l-4 !border-l-danger">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold">{a.title}</h3>
                  <Badge value={a.priority} />
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted">{a.body}</p>
                <p className="mt-2 text-[11px] text-muted">{fmtDate(a.date)} · {a.posted_by}</p>
              </Card>
            ))}
          </div>
        )}
      </motion.section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Today's classes */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Today&apos;s classes</h2>
            <Link href="/schedule" className="text-xs font-medium text-accent hover:underline">Full timetable</Link>
          </div>
          {todayClasses === null ? (
            <Skeleton className="h-40" />
          ) : todayClasses.length === 0 ? (
            <Card><p className="text-sm text-muted">No classes today.</p></Card>
          ) : (
            <div className="space-y-2">
              {todayClasses.map((c) => (
                <Card key={c.id} className="!p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{c.course} — {c.title}</div>
                      <div className="text-xs text-muted">{c.room} · {c.instructor}</div>
                    </div>
                    <div className="shrink-0 rounded-lg bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
                      {fmt12h(c.start_time)}–{fmt12h(c.end_time)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </motion.section>

        {/* Upcoming events */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Upcoming events</h2>
            <Link href="/events" className="text-xs font-medium text-accent hover:underline">All events</Link>
          </div>
          {upcomingEvents === null ? (
            <Skeleton className="h-40" />
          ) : upcomingEvents.length === 0 ? (
            <Card><p className="text-sm text-muted">No upcoming events.</p></Card>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.slice(0, 4).map((e) => (
                <Card key={e.id} className="!p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{e.name}</div>
                      <div className="text-xs text-muted">{fmtDate(e.date)} · {fmt12h(e.start_time)} · {e.venue}</div>
                    </div>
                    <Badge value={e.status} />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}

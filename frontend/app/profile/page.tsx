'use client';
import { api, fmt12h, fmtDate, ApiError } from '@/lib/api';
import { clearAuth, useAuth } from '@/lib/auth';
import type { Booking, CampusEvent, Room } from '@/lib/types';
import { motion } from 'framer-motion';
import { CalendarDays, DoorOpen, IdCard, LogOut, Mail, PartyPopper, User, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card, EmptyState, Skeleton } from '@/components/ui';
import { useToast } from '@/components/Toast';

interface MyBooking extends Booking { room_number: string }

export default function ProfilePage() {
  const { ready, user, signedIn, identity } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [bookings, setBookings] = useState<MyBooking[] | null>(null);
  const [myEvents, setMyEvents] = useState<CampusEvent[] | null>(null);

  const load = useCallback(async () => {
    try {
      const [rooms, events] = await Promise.all([api.rooms.list(), api.events.list()]);
      const mine: MyBooking[] = rooms.flatMap((r: Room) =>
        (r.bookings || [])
          .filter((b) => b.booked_by.toLowerCase() === identity.name.toLowerCase())
          .map((b) => ({ ...b, room_number: r.room_number }))
      ).sort((a, b) => a.date.localeCompare(b.date));
      setBookings(mine);
      setMyEvents(events.filter((e: CampusEvent) =>
        e.registrations?.some((reg) => reg.student_id === identity.student_id)
      ));
    } catch (e) {
      toast((e as Error).message, 'error');
      setBookings([]); setMyEvents([]);
    }
  }, [identity.name, identity.student_id, toast]);

  useEffect(() => { if (ready) load(); }, [ready, load]);

  const cancelBooking = async (b: MyBooking) => {
    try {
      await api.rooms.cancelBooking(b.booking_id, identity.name);
      toast('Booking cancelled'); load();
    } catch (e) { toast(e instanceof ApiError ? e.message : 'Cancel failed', 'error'); }
  };

  const cancelReg = async (evt: CampusEvent) => {
    try {
      await api.events.cancelRegistration(evt.id, identity.student_id);
      toast('Registration cancelled'); load();
    } catch (e) { toast(e instanceof ApiError ? e.message : 'Cancel failed', 'error'); }
  };

  const signOut = () => { clearAuth(); toast('Signed out'); router.push('/login'); };

  if (!ready) return <div className="mx-auto max-w-3xl"><Skeleton className="h-40" /></div>;

  return (
    <div className="mx-auto max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="!p-7">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-accent-fg">
              {identity.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="flex items-center gap-2 text-xl font-bold">
                {identity.name}
                {!signedIn && <Badge value="demo user" className="!bg-warning/15 !text-warning" />}
              </h1>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                <span className="flex items-center gap-1"><IdCard size={13} /> {identity.student_id}</span>
                {user?.email && <span className="flex items-center gap-1"><Mail size={13} /> {user.email}</span>}
              </div>
            </div>
            {signedIn ? (
              <Button variant="ghost" onClick={signOut}><LogOut size={15} /> Sign out</Button>
            ) : (
              <div className="flex gap-2">
                <Link href="/login"><Button variant="soft"><User size={15} /> Sign in</Button></Link>
                <Link href="/register"><Button>Create account</Button></Link>
              </div>
            )}
          </div>
          {!signedIn && (
            <p className="mt-4 rounded-xl bg-surface-2 px-4 py-2.5 text-xs text-muted">
              You are browsing as the demo user. Sign in so your bookings and event registrations are made under your own name and student ID.
            </p>
          )}
        </Card>
      </motion.div>

      {/* My room bookings */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-7">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><DoorOpen size={17} className="text-accent" /> My room bookings</h2>
        {bookings === null ? (
          <Skeleton className="h-24" />
        ) : bookings.length === 0 ? (
          <EmptyState message="No room bookings yet. Book one from the Rooms page or ask the AI assistant." />
        ) : (
          <div className="space-y-2">
            {bookings.map((b) => (
              <Card key={b.booking_id} className="flex items-center justify-between gap-3 !py-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Room {b.room_number}</div>
                  <div className="text-xs text-muted">
                    <CalendarDays size={11} className="inline" /> {fmtDate(b.date)} · {fmt12h(b.start_time)}–{fmt12h(b.end_time)}
                    {b.purpose ? ` · ${b.purpose}` : ''}
                  </div>
                </div>
                <Button variant="ghost" className="!px-3 !py-1.5 !text-xs" onClick={() => cancelBooking(b)}>
                  <X size={13} /> Cancel
                </Button>
              </Card>
            ))}
          </div>
        )}
      </motion.section>

      {/* My event registrations */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-7">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><PartyPopper size={17} className="text-accent" /> My event registrations</h2>
        {myEvents === null ? (
          <Skeleton className="h-24" />
        ) : myEvents.length === 0 ? (
          <EmptyState message="No event registrations yet. Register from the Events page or ask the AI assistant." />
        ) : (
          <div className="space-y-2">
            {myEvents.map((e) => (
              <Card key={e.id} className="flex items-center justify-between gap-3 !py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{e.name}</span>
                    <Badge value={e.status} />
                  </div>
                  <div className="text-xs text-muted">
                    <CalendarDays size={11} className="inline" /> {fmtDate(e.date)} · {fmt12h(e.start_time)}–{fmt12h(e.end_time)} · {e.venue}
                  </div>
                </div>
                <Button variant="ghost" className="!px-3 !py-1.5 !text-xs" onClick={() => cancelReg(e)}>
                  <X size={13} /> Cancel
                </Button>
              </Card>
            ))}
          </div>
        )}
      </motion.section>
    </div>
  );
}

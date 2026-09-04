'use client';
import { api, fmt12h, fmtDate, ApiError } from '@/lib/api';
import type { Room } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';
import { AirVent, Computer, MonitorPlay, Pencil, PenLine, Plus, Presentation, Search, Trash2, Users, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, ConfirmDialog, EmptyState, Field, Input, Modal, Select, Skeleton } from '@/components/ui';
import { useToast } from '@/components/Toast';

const CURRENT_USER = 'Dhrubo';
const tomorrow = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);

const equipIcon = (e: string) => {
  const cls = 'inline';
  if (e.includes('projector')) return <MonitorPlay size={12} className={cls} />;
  if (e.includes('AC')) return <AirVent size={12} className={cls} />;
  if (e.includes('computer')) return <Computer size={12} className={cls} />;
  if (e.includes('smart')) return <Presentation size={12} className={cls} />;
  return <PenLine size={12} className={cls} />;
};

const WINGS: { key: string; label: string }[] = [
  { key: '7A', label: '7A — Classrooms' },
  { key: '7B', label: '7B — Labs' },
  { key: '7C', label: '7C — Seminar Halls' },
];

const emptyRoom = () => ({ room_number: '', type: 'classroom', capacity: '40', equipment: 'whiteboard, projector, AC', floor: '7', status: 'available' });
const emptyBooking = () => ({ date: tomorrow(), start_time: '15:00', end_time: '17:00', booked_by: CURRENT_USER, purpose: '' });

export default function RoomsPage() {
  const toast = useToast();
  const [items, setItems] = useState<Room[] | null>(null);
  const [type, setType] = useState('');
  const [minCap, setMinCap] = useState('');
  const [equip, setEquip] = useState('');
  const [detail, setDetail] = useState<Room | null>(null);
  const [roomModal, setRoomModal] = useState<{ mode: 'add' | 'edit'; item?: Room } | null>(null);
  const [confirm, setConfirm] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState<Record<string, string>>(emptyRoom());
  const [bookingForm, setBookingForm] = useState<Record<string, string>>(emptyBooking());
  const [finder, setFinder] = useState({ date: tomorrow(), start: '14:00', end: '16:00', minCapacity: '', equipment: '' });
  const [finderResults, setFinderResults] = useState<Room[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.rooms.list();
      setItems(data);
      setDetail((d) => (d ? data.find((r) => r.id === d.id) ?? null : null));
    } catch (e) { setItems([]); toast((e as Error).message, 'error'); }
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => (items ?? []).filter((r) =>
    (!type || r.type === type) &&
    (!minCap || r.capacity >= Number(minCap)) &&
    (!equip || r.equipment.some((x) => x.toLowerCase().includes(equip.toLowerCase())))
  ), [items, type, minCap, equip]);

  const saveRoom = async () => {
    setBusy(true);
    const payload = {
      room_number: roomForm.room_number,
      type: roomForm.type as Room['type'],
      capacity: Number(roomForm.capacity),
      equipment: roomForm.equipment.split(',').map((s) => s.trim()).filter(Boolean),
      floor: Number(roomForm.floor),
      status: roomForm.status as Room['status'],
    };
    try {
      if (roomModal?.mode === 'add') { await api.rooms.create(payload); toast('Room added'); }
      else if (roomModal?.item) { await api.rooms.update(roomModal.item.id, payload); toast('Room updated'); }
      setRoomModal(null); load();
    } catch (e) { toast(e instanceof ApiError ? e.message : 'Failed to save', 'error'); }
    finally { setBusy(false); }
  };

  const delRoom = async (r: Room) => {
    try { await api.rooms.remove(r.id); toast('Room deleted'); setDetail(null); load(); }
    catch (e) { toast(e instanceof ApiError ? e.message : 'Failed to delete', 'error'); }
  };

  const book = async (roomNumber: string) => {
    setBusy(true);
    try {
      await api.rooms.book(roomNumber, {
        date: bookingForm.date, start_time: bookingForm.start_time, end_time: bookingForm.end_time,
        booked_by: bookingForm.booked_by, purpose: bookingForm.purpose || 'Booked via dashboard',
      });
      toast(`Room ${roomNumber} booked ✓`);
      setBookingForm(emptyBooking());
      setFinderResults(null);
      load();
    } catch (e) { toast(e instanceof ApiError ? e.message : 'Booking failed', 'error'); }
    finally { setBusy(false); }
  };

  const cancelBooking = async (bookingId: string) => {
    try { await api.rooms.cancelBooking(bookingId, CURRENT_USER); toast('Booking cancelled'); load(); }
    catch (e) { toast(e instanceof ApiError ? e.message : 'Cancel failed', 'error'); }
  };

  const runFinder = async () => {
    setBusy(true);
    try {
      setFinderResults(await api.rooms.findAvailable({
        date: finder.date, start: finder.start, end: finder.end,
        minCapacity: finder.minCapacity ? Number(finder.minCapacity) : undefined,
        equipment: finder.equipment || undefined,
      }));
    } catch (e) { toast(e instanceof ApiError ? e.message : 'Search failed', 'error'); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Rooms</h1>
          <p className="mt-1 text-sm text-muted">Classrooms, labs & seminar halls — Building 7</p>
        </div>
        <Button onClick={() => { setRoomForm(emptyRoom()); setRoomModal({ mode: 'add' }); }}><Plus size={16} /> Add room</Button>
      </div>

      {/* Find a room */}
      <Card className="mb-6">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Search size={15} /> Find a free room</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          <Input type="date" value={finder.date} onChange={(e) => setFinder({ ...finder, date: e.target.value })} />
          <Input type="time" value={finder.start} onChange={(e) => setFinder({ ...finder, start: e.target.value })} />
          <Input type="time" value={finder.end} onChange={(e) => setFinder({ ...finder, end: e.target.value })} />
          <Input type="number" placeholder="Min capacity" value={finder.minCapacity} onChange={(e) => setFinder({ ...finder, minCapacity: e.target.value })} />
          <Input placeholder="Equipment" value={finder.equipment} onChange={(e) => setFinder({ ...finder, equipment: e.target.value })} />
          <Button onClick={runFinder} disabled={busy}>{busy ? 'Searching…' : 'Search'}</Button>
        </div>
        {finderResults && (
          <div className="mt-4">
            {finderResults.length === 0 ? (
              <p className="text-sm text-muted">No rooms free for that slot. Try a different time.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {finderResults.map((r) => (
                  <div key={r.id} className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm">
                    <span className="font-semibold">{r.room_number}</span>
                    <span className="text-xs text-muted"><Users size={11} className="inline" /> {r.capacity}</span>
                    <Button variant="soft" className="!px-2.5 !py-1 !text-xs"
                      onClick={() => { setBookingForm({ date: finder.date, start_time: finder.start, end_time: finder.end, booked_by: CURRENT_USER, purpose: '' }); book(r.room_number); }}>
                      Book
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="mb-5 flex flex-wrap gap-2">
        <Select value={type} onChange={(e) => setType(e.target.value)} className="!w-40">
          <option value="">All types</option>
          <option value="classroom">Classroom</option><option value="lab">Lab</option><option value="seminar">Seminar</option>
        </Select>
        <Input type="number" placeholder="Min capacity" value={minCap} onChange={(e) => setMinCap(e.target.value)} className="!w-36" />
        <Input placeholder="Equipment (e.g. projector)" value={equip} onChange={(e) => setEquip(e.target.value)} className="!w-52" />
      </div>

      {items === null ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-36" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState message="No rooms match your filters." />
      ) : (
        WINGS.map(({ key, label }) => {
          const wingRooms = filtered.filter((r) => r.room_number.startsWith(key));
          if (!wingRooms.length) return null;
          return (
            <section key={key} className="mb-7">
              <h2 className="mb-3 text-sm font-semibold text-muted">{label}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <AnimatePresence>
                  {wingRooms.map((r) => (
                    <motion.div key={r.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                      <Card onClick={() => { setDetail(r); setBookingForm(emptyBooking()); }} className="group h-full hover:border-accent/50">
                        <div className="flex items-start justify-between">
                          <span className="text-lg font-bold">{r.room_number}</span>
                          <Badge value={r.status} />
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                          <Badge value={r.type} /> <span><Users size={11} className="inline" /> {r.capacity}</span>
                        </div>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {r.equipment.map((e) => (
                            <span key={e} className="flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted">
                              {equipIcon(e)} {e}
                            </span>
                          ))}
                        </div>
                        {(r.bookings?.length ?? 0) > 0 && (
                          <p className="mt-2 text-[11px] font-medium text-warning">{r.bookings!.length} booking{r.bookings!.length > 1 ? 's' : ''}</p>
                        )}
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          );
        })
      )}

      {/* Room detail + booking modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `Room ${detail.room_number}` : ''} wide>
        {detail && (
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
              <Badge value={detail.type} /><Badge value={detail.status} />
              <span className="text-muted"><Users size={13} className="inline" /> Capacity {detail.capacity} · Floor {detail.floor}</span>
              <span className="ml-auto flex gap-1">
                <button onClick={() => { setRoomForm({ room_number: detail.room_number, type: detail.type, capacity: String(detail.capacity), equipment: detail.equipment.join(', '), floor: String(detail.floor), status: detail.status }); setRoomModal({ mode: 'edit', item: detail }); setDetail(null); }}
                  className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-accent" aria-label="Edit room"><Pencil size={15} /></button>
                <button onClick={() => { setConfirm(detail); setDetail(null); }} className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-danger" aria-label="Delete room"><Trash2 size={15} /></button>
              </span>
            </div>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {detail.equipment.map((e) => (
                <span key={e} className="flex items-center gap-1 rounded-md bg-surface-2 px-2 py-1 text-xs text-muted">{equipIcon(e)} {e}</span>
              ))}
            </div>

            <h3 className="mb-2 text-sm font-semibold">Bookings</h3>
            {(detail.bookings?.length ?? 0) === 0 ? (
              <p className="mb-4 text-sm text-muted">No bookings for this room.</p>
            ) : (
              <div className="mb-4 space-y-2">
                {detail.bookings!.map((b) => (
                  <div key={b.booking_id} className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2 text-sm">
                    <div>
                      <span className="font-medium">{fmtDate(b.date)}</span> · {fmt12h(b.start_time)}–{fmt12h(b.end_time)}
                      <span className="text-muted"> · {b.booked_by} · {b.purpose}</span>
                    </div>
                    <button onClick={() => cancelBooking(b.booking_id)} className="rounded-lg p-1.5 text-muted hover:text-danger" title="Cancel booking (must be yours)" aria-label="Cancel booking">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <h3 className="mb-2 text-sm font-semibold">Book this room</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <Input type="date" value={bookingForm.date} onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })} />
              <Input type="time" value={bookingForm.start_time} onChange={(e) => setBookingForm({ ...bookingForm, start_time: e.target.value })} />
              <Input type="time" value={bookingForm.end_time} onChange={(e) => setBookingForm({ ...bookingForm, end_time: e.target.value })} />
              <Input placeholder="Purpose" value={bookingForm.purpose} onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })} />
              <Button onClick={() => book(detail.room_number)} disabled={busy}>{busy ? 'Booking…' : 'Book'}</Button>
            </div>
            <p className="mt-2 text-[11px] text-muted">Booking as {CURRENT_USER}. Conflicts with classes and other bookings are checked automatically.</p>
          </div>
        )}
      </Modal>

      {/* Add/Edit room modal */}
      <Modal open={!!roomModal} onClose={() => setRoomModal(null)} title={roomModal?.mode === 'add' ? 'Add room' : 'Edit room'}>
        <div className="grid grid-cols-2 gap-x-3">
          <Field label="Room number"><Input value={roomForm.room_number} onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })} placeholder="7A08" /></Field>
          <Field label="Type">
            <Select value={roomForm.type} onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}>
              <option value="classroom">Classroom</option><option value="lab">Lab</option><option value="seminar">Seminar</option>
            </Select>
          </Field>
          <Field label="Capacity"><Input type="number" min={1} value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })} /></Field>
          <Field label="Floor"><Input type="number" value={roomForm.floor} onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })} /></Field>
        </div>
        <Field label="Equipment (comma separated)"><Input value={roomForm.equipment} onChange={(e) => setRoomForm({ ...roomForm, equipment: e.target.value })} /></Field>
        <Field label="Status">
          <Select value={roomForm.status} onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value })}>
            <option value="available">Available</option><option value="unavailable">Unavailable</option>
          </Select>
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRoomModal(null)}>Cancel</Button>
          <Button onClick={saveRoom} disabled={busy || !roomForm.room_number}>{busy ? 'Saving…' : 'Save'}</Button>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => confirm && delRoom(confirm)}
        message={`Delete room ${confirm?.room_number} and all its bookings? This cannot be undone.`} />
    </div>
  );
}

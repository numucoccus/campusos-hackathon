'use client';
import { api, fmt12h, fmtDate, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { CampusEvent } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, MapPin, Pencil, Plus, Trash2, UserPlus, Users, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, ConfirmDialog, EmptyState, Field, Input, Modal, Select, Skeleton, TextArea } from '@/components/ui';
import { useToast } from '@/components/Toast';

const today = () => new Date().toISOString().slice(0, 10);
const empty = () => ({ name: '', description: '', date: today(), start_time: '10:00', end_time: '12:00', end_date: '', venue: '', organizer: '', capacity: '50', status: 'upcoming' });

export default function EventsPage() {
  const toast = useToast();
  const { identity } = useAuth();
  const [items, setItems] = useState<CampusEvent[] | null>(null);
  const [status, setStatus] = useState('');
  const [detail, setDetail] = useState<CampusEvent | null>(null);
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; item?: CampusEvent } | null>(null);
  const [regModal, setRegModal] = useState<CampusEvent | null>(null);
  const [confirm, setConfirm] = useState<CampusEvent | null>(null);
  const [form, setForm] = useState<Record<string, string>>(empty());
  const [regForm, setRegForm] = useState({ student_id: identity.student_id, name: identity.name });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.events.list();
      setItems(data);
      setDetail((d) => (d ? data.find((e) => e.id === d.id) ?? null : null));
    } catch (e) { setItems([]); toast((e as Error).message, 'error'); }
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => (items ?? [])
    .filter((e) => !status || e.status === status)
    .sort((a, b) => a.date.localeCompare(b.date)),
  [items, status]);

  const openAdd = () => { setForm(empty()); setModal({ mode: 'add' }); };
  const openEdit = (e: CampusEvent) => {
    setForm({ name: e.name, description: e.description, date: e.date, start_time: e.start_time, end_time: e.end_time, end_date: e.end_date, venue: e.venue, organizer: e.organizer, capacity: String(e.capacity), status: e.status });
    setModal({ mode: 'edit', item: e });
  };

  const save = async () => {
    setBusy(true);
    const payload = { ...form, capacity: Number(form.capacity), end_date: form.end_date || form.date };
    try {
      if (modal?.mode === 'add') { await api.events.create(payload as unknown as Omit<CampusEvent, 'id' | 'registrations'>); toast('Event created'); }
      else if (modal?.item) { await api.events.update(modal.item.id, payload as Partial<CampusEvent>); toast('Event updated'); }
      setModal(null); load();
    } catch (e) { toast(e instanceof ApiError ? e.message : 'Failed to save', 'error'); }
    finally { setBusy(false); }
  };

  const del = async (e: CampusEvent) => {
    try { await api.events.remove(e.id); toast('Event deleted'); setDetail(null); load(); }
    catch (err) { toast(err instanceof ApiError ? err.message : 'Failed to delete', 'error'); }
  };

  const register = async () => {
    if (!regModal) return;
    setBusy(true);
    try {
      await api.events.register(regModal.id, regForm);
      toast(`Registered for "${regModal.name}" ✓`);
      setRegModal(null); load();
    } catch (e) { toast(e instanceof ApiError ? e.message : 'Registration failed', 'error'); }
    finally { setBusy(false); }
  };

  const cancelReg = async (evt: CampusEvent, studentId: string) => {
    try { await api.events.cancelRegistration(evt.id, studentId); toast('Registration cancelled'); load(); }
    catch (e) { toast(e instanceof ApiError ? e.message : 'Cancel failed', 'error'); }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="mt-1 text-sm text-muted">What&apos;s happening on campus</p>
        </div>
        <Button onClick={openAdd}><Plus size={16} /> Create event</Button>
      </div>

      <div className="mb-5">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="!w-44">
          <option value="">All statuses</option>
          <option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option>
          <option value="full">Full</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
        </Select>
      </div>

      {items === null ? (
        <div className="grid gap-4 md:grid-cols-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-44" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState message="No events match your filter." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence>
            {filtered.map((e) => {
              const pct = Math.min(100, Math.round((e.registered / e.capacity) * 100));
              const isRegistered = e.registrations?.some((r) => r.student_id === identity.student_id);
              return (
                <motion.div key={e.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}>
                  <Card className="group flex h-full flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold leading-snug">{e.name}</h3>
                      <Badge value={e.status} />
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-xs text-muted">{e.description}</p>
                    <div className="mt-3 space-y-1 text-xs text-muted">
                      <div className="flex items-center gap-1.5"><CalendarDays size={12} /> {fmtDate(e.date)}{e.end_date !== e.date ? ` – ${fmtDate(e.end_date)}` : ''} · {fmt12h(e.start_time)}–{fmt12h(e.end_time)}</div>
                      <div className="flex items-center gap-1.5"><MapPin size={12} /> {e.venue} · {e.organizer}</div>
                    </div>
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-[11px] text-muted">
                        <span><Users size={11} className="inline" /> {e.registered}/{e.capacity} registered</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <motion.div
                          className={`h-full rounded-full ${pct >= 100 ? 'bg-danger' : pct >= 80 ? 'bg-warning' : 'bg-accent'}`}
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      {isRegistered ? (
                        <Button variant="ghost" className="!py-1.5 !text-xs" onClick={() => cancelReg(e, identity.student_id)}>
                          <X size={13} /> Cancel my registration
                        </Button>
                      ) : (
                        <Button variant="soft" className="!py-1.5 !text-xs"
                          disabled={['full', 'cancelled', 'completed'].includes(e.status)}
                          onClick={() => { setRegForm({ student_id: identity.student_id, name: identity.name }); setRegModal(e); }}>
                          <UserPlus size={13} /> Register
                        </Button>
                      )}
                      <Button variant="ghost" className="!py-1.5 !text-xs" onClick={() => setDetail(e)}>Details</Button>
                      <span className="ml-auto flex gap-1 opacity-0 transition group-hover:opacity-100">
                        <button onClick={() => openEdit(e)} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-accent" aria-label="Edit"><Pencil size={14} /></button>
                        <button onClick={() => setConfirm(e)} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-danger" aria-label="Delete"><Trash2 size={14} /></button>
                      </span>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Detail drawer */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? ''} wide>
        {detail && (
          <div>
            <p className="mb-3 text-sm text-muted">{detail.description}</p>
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted">
              <Badge value={detail.status} />
              <span><CalendarDays size={12} className="inline" /> {fmtDate(detail.date)} · {fmt12h(detail.start_time)}–{fmt12h(detail.end_time)}</span>
              <span><MapPin size={12} className="inline" /> {detail.venue}</span>
              <span>Organized by {detail.organizer}</span>
            </div>
            <h3 className="mb-2 text-sm font-semibold">Registrations ({detail.registered}/{detail.capacity})</h3>
            {(detail.registrations?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted">No registrations recorded yet.</p>
            ) : (
              <div className="max-h-64 space-y-1.5 overflow-y-auto">
                {detail.registrations!.map((r) => (
                  <div key={r.student_id} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-1.5 text-sm">
                    <span>{r.name} <span className="text-xs text-muted">({r.student_id})</span></span>
                    {r.student_id === identity.student_id && (
                      <button onClick={() => cancelReg(detail, r.student_id)} className="text-muted hover:text-danger" aria-label="Cancel registration"><X size={14} /></button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Register modal */}
      <Modal open={!!regModal} onClose={() => setRegModal(null)} title={`Register — ${regModal?.name ?? ''}`}>
        <Field label="Student ID"><Input value={regForm.student_id} onChange={(e) => setRegForm({ ...regForm, student_id: e.target.value })} /></Field>
        <Field label="Name"><Input value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} /></Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRegModal(null)}>Cancel</Button>
          <Button onClick={register} disabled={busy || !regForm.student_id || !regForm.name}>{busy ? 'Registering…' : 'Register'}</Button>
        </div>
      </Modal>

      {/* Add/Edit event modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'add' ? 'Create event' : 'Edit event'} wide>
        <Field label="Event name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Description"><TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-x-3 md:grid-cols-4">
          <Field label="Date"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="End date"><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></Field>
          <Field label="Start"><Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></Field>
          <Field label="End"><Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-x-3 md:grid-cols-4">
          <Field label="Venue"><Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="7C01" /></Field>
          <Field label="Organizer"><Input value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} /></Field>
          <Field label="Capacity"><Input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="full">Full</option>
            </Select>
          </Field>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
          <Button onClick={save} disabled={busy || !form.name || !form.venue || !form.organizer}>{busy ? 'Saving…' : 'Save'}</Button>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => confirm && del(confirm)}
        message={`Delete "${confirm?.name}" and all its registrations? This cannot be undone.`} />
    </div>
  );
}

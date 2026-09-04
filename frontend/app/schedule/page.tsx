'use client';
import { api, fmt12h, ApiError } from '@/lib/api';
import type { Schedule } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, List, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, ConfirmDialog, EmptyState, Field, Input, Modal, Select, Skeleton } from '@/components/ui';
import { useToast } from '@/components/Toast';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'] as const;
const empty = { course: '', title: '', day: 'Sunday', start_time: '08:00', end_time: '08:50', room: '', instructor: 'TBA', section: '' };

export default function SchedulePage() {
  const toast = useToast();
  const [items, setItems] = useState<Schedule[] | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [dayFilter, setDayFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; item?: Schedule } | null>(null);
  const [confirm, setConfirm] = useState<Schedule | null>(null);
  const [form, setForm] = useState<Record<string, string>>(empty);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.schedules.list().then(setItems).catch((e) => { setItems([]); toast(e.message, 'error'); });
  }, [toast]);
  useEffect(load, [load]);

  const filtered = useMemo(() => (items ?? []).filter((s) =>
    (!dayFilter || s.day === dayFilter) &&
    (!courseFilter || s.course.toLowerCase().includes(courseFilter.toLowerCase()) || s.title.toLowerCase().includes(courseFilter.toLowerCase()))
  ), [items, dayFilter, courseFilter]);

  const openAdd = () => { setForm(empty); setModal({ mode: 'add' }); };
  const openEdit = (item: Schedule) => {
    setForm({ course: item.course, title: item.title, day: item.day, start_time: item.start_time, end_time: item.end_time, room: item.room, instructor: item.instructor, section: item.section });
    setModal({ mode: 'edit', item });
  };

  const save = async () => {
    if (form.end_time <= form.start_time) return toast('End time must be after start time', 'error');
    setSaving(true);
    try {
      if (modal?.mode === 'add') {
        await api.schedules.create(form as unknown as Omit<Schedule, 'id'>);
        toast('Class added');
      } else if (modal?.item) {
        await api.schedules.update(modal.item.id, form as Partial<Schedule>);
        toast('Class updated');
      }
      setModal(null);
      load();
    } catch (e) { toast(e instanceof ApiError ? e.message : 'Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const del = async (item: Schedule) => {
    try { await api.schedules.remove(item.id); toast('Class deleted'); load(); }
    catch (e) { toast(e instanceof ApiError ? e.message : 'Failed to delete', 'error'); }
  };

  const byDay = (day: string) => filtered.filter((s) => s.day === day).sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Class Schedule</h1>
          <p className="mt-1 text-sm text-muted">Weekly timetable · Sunday–Thursday</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setView(view === 'grid' ? 'list' : 'grid')}>
            {view === 'grid' ? <List size={16} /> : <CalendarDays size={16} />}
            {view === 'grid' ? 'List' : 'Grid'}
          </Button>
          <Button onClick={openAdd}><Plus size={16} /> Add class</Button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <Select value={dayFilter} onChange={(e) => setDayFilter(e.target.value)} className="!w-40">
          <option value="">All days</option>
          {DAYS.map((d) => <option key={d}>{d}</option>)}
        </Select>
        <Input placeholder="Filter by course…" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="!w-56" />
      </div>

      {items === null ? (
        <div className="grid gap-3 md:grid-cols-5">{DAYS.map((d) => <Skeleton key={d} className="h-64" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState message="No classes match your filters. Add one with the button above." />
      ) : view === 'grid' ? (
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          {DAYS.filter((d) => !dayFilter || d === dayFilter).map((day) => (
            <div key={day}>
              <h3 className="mb-2 text-center text-sm font-semibold text-muted">{day}</h3>
              <div className="space-y-2">
                <AnimatePresence>
                  {byDay(day).map((c) => (
                    <motion.div key={c.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                      <Card className="group !p-3">
                        <div className="text-xs font-bold text-accent">{fmt12h(c.start_time)}–{fmt12h(c.end_time)}</div>
                        <div className="mt-1 text-sm font-semibold leading-tight">{c.course}</div>
                        <div className="mt-0.5 line-clamp-2 text-[11px] text-muted">{c.title}</div>
                        <div className="mt-1.5 text-[11px] text-muted">📍 {c.room} · Sec {c.section}</div>
                        <div className="truncate text-[11px] text-muted">{c.instructor}</div>
                        <div className="mt-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                          <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-accent" aria-label="Edit"><Pencil size={13} /></button>
                          <button onClick={() => setConfirm(c)} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-danger" aria-label="Delete"><Trash2 size={13} /></button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {byDay(day).length === 0 && <p className="py-4 text-center text-[11px] text-muted">—</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.start_time.localeCompare(b.start_time)).map((c) => (
              <motion.div key={c.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Card className="group flex items-center justify-between gap-3 !py-3">
                  <div className="flex min-w-0 items-center gap-4">
                    <Badge value={c.day.slice(0, 3)} className="!bg-accent-soft !text-accent w-12 justify-center" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{c.course} — {c.title}</div>
                      <div className="text-xs text-muted">{fmt12h(c.start_time)}–{fmt12h(c.end_time)} · {c.room} · Sec {c.section} · {c.instructor}</div>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                    <button onClick={() => openEdit(c)} className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-accent" aria-label="Edit"><Pencil size={15} /></button>
                    <button onClick={() => setConfirm(c)} className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-danger" aria-label="Delete"><Trash2 size={15} /></button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'add' ? 'Add class' : 'Edit class'}>
        <div className="grid grid-cols-2 gap-x-3">
          <Field label="Course code"><Input value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} placeholder="CSE 4113" /></Field>
          <Field label="Section"><Input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} placeholder="B" /></Field>
        </div>
        <Field label="Course title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Pattern Recognition…" /></Field>
        <div className="grid grid-cols-3 gap-x-3">
          <Field label="Day">
            <Select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>
              {DAYS.map((d) => <option key={d}>{d}</option>)}
            </Select>
          </Field>
          <Field label="Start"><Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></Field>
          <Field label="End"><Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-x-3">
          <Field label="Room"><Input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="7A03" /></Field>
          <Field label="Instructor"><Input value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} /></Field>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !form.course || !form.title || !form.room || !form.section}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && del(confirm)}
        message={`Delete ${confirm?.course} on ${confirm?.day} at ${confirm ? fmt12h(confirm.start_time) : ''}? This cannot be undone.`}
      />
    </div>
  );
}

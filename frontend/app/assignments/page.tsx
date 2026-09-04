'use client';
import { api, fmtDate, ApiError } from '@/lib/api';
import type { Assignment } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, ConfirmDialog, EmptyState, Field, Input, Modal, Select, Skeleton, TextArea } from '@/components/ui';
import { useToast } from '@/components/Toast';

const today = () => new Date().toISOString().slice(0, 10);
const empty = () => ({ course: '', course_title: '', title: '', description: '', assigned_date: today(), deadline: today(), submission_platform: 'Google Classroom', status: 'pending', marks: '10' });

const daysLeft = (deadline: string) => {
  const ms = new Date(`${deadline}T23:59:59`).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
};

export default function AssignmentsPage() {
  const toast = useToast();
  const [items, setItems] = useState<Assignment[] | null>(null);
  const [course, setCourse] = useState('');
  const [status, setStatus] = useState('');
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; item?: Assignment } | null>(null);
  const [confirm, setConfirm] = useState<Assignment | null>(null);
  const [form, setForm] = useState<Record<string, string>>(empty());
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.assignments.list().then(setItems).catch((e) => { setItems([]); toast(e.message, 'error'); });
  }, [toast]);
  useEffect(load, [load]);

  const filtered = useMemo(() => (items ?? [])
    .filter((a) => (!course || a.course.toLowerCase().includes(course.toLowerCase())) && (!status || a.status === status))
    .sort((a, b) => a.deadline.localeCompare(b.deadline)),
  [items, course, status]);

  const openAdd = () => { setForm(empty()); setModal({ mode: 'add' }); };
  const openEdit = (a: Assignment) => {
    setForm({ course: a.course, course_title: a.course_title, title: a.title, description: a.description, assigned_date: a.assigned_date, deadline: a.deadline, submission_platform: a.submission_platform, status: a.status, marks: String(a.marks) });
    setModal({ mode: 'edit', item: a });
  };

  const save = async () => {
    setSaving(true);
    const payload = { ...form, marks: Number(form.marks) };
    try {
      if (modal?.mode === 'add') { await api.assignments.create(payload as unknown as Omit<Assignment, 'id'>); toast('Assignment added'); }
      else if (modal?.item) { await api.assignments.update(modal.item.id, payload as Partial<Assignment>); toast('Assignment updated'); }
      setModal(null); load();
    } catch (e) { toast(e instanceof ApiError ? e.message : 'Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const quickStatus = async (a: Assignment, s: string) => {
    try { await api.assignments.update(a.id, { status: s as Assignment['status'] }); toast(`Marked ${s}`); load(); }
    catch (e) { toast(e instanceof ApiError ? e.message : 'Failed', 'error'); }
  };

  const del = async (a: Assignment) => {
    try { await api.assignments.remove(a.id); toast('Assignment deleted'); load(); }
    catch (e) { toast(e instanceof ApiError ? e.message : 'Failed to delete', 'error'); }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Assignments</h1>
          <p className="mt-1 text-sm text-muted">Deadlines and submission status</p>
        </div>
        <Button onClick={openAdd}><Plus size={16} /> Add assignment</Button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <Input placeholder="Filter by course…" value={course} onChange={(e) => setCourse(e.target.value)} className="!w-52" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="!w-44">
          <option value="">All statuses</option>
          <option value="pending">Pending</option><option value="submitted">Submitted</option>
          <option value="graded">Graded</option><option value="late">Late</option>
        </Select>
      </div>

      {items === null ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState message="No assignments match your filters." />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((a) => {
              const d = daysLeft(a.deadline);
              const dueSoon = a.status === 'pending' && d >= 0 && d <= 7;
              const overdue = a.status === 'pending' && d < 0;
              return (
                <motion.div key={a.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}>
                  <Card className={`group ${dueSoon ? 'border-warning/50' : ''} ${overdue ? 'border-danger/60' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">{a.course}</span>
                          <h3 className="text-sm font-semibold">{a.title}</h3>
                          <Badge value={a.status} />
                          {dueSoon && <Badge value="due this week" className="!bg-warning/15 !text-warning" />}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-muted">{a.description}</p>
                        <p className="mt-2 text-[11px] text-muted">
                          {a.course_title} · {a.marks} marks · Submit via {a.submission_platform}
                        </p>
                        <p className={`mt-1 text-xs font-medium ${overdue ? 'text-danger' : dueSoon ? 'text-warning' : 'text-muted'}`}>
                          Deadline {fmtDate(a.deadline)}
                          {a.status === 'pending' && (overdue ? ` · ${-d} day${d === -1 ? '' : 's'} overdue` : ` · ${d} day${d === 1 ? '' : 's'} left`)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                          <button onClick={() => openEdit(a)} className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-accent" aria-label="Edit"><Pencil size={15} /></button>
                          <button onClick={() => setConfirm(a)} className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-danger" aria-label="Delete"><Trash2 size={15} /></button>
                        </div>
                        <Select value={a.status} onChange={(e) => quickStatus(a, e.target.value)} className="!w-32 !py-1 !text-xs">
                          <option value="pending">Pending</option><option value="submitted">Submitted</option>
                          <option value="graded">Graded</option><option value="late">Late</option>
                        </Select>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'add' ? 'Add assignment' : 'Edit assignment'} wide>
        <div className="grid grid-cols-2 gap-x-3">
          <Field label="Course code"><Input value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} placeholder="CSE 4113" /></Field>
          <Field label="Course title"><Input value={form.course_title} onChange={(e) => setForm({ ...form, course_title: e.target.value })} /></Field>
        </div>
        <Field label="Assignment title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Description"><TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-x-3 md:grid-cols-4">
          <Field label="Assigned"><Input type="date" value={form.assigned_date} onChange={(e) => setForm({ ...form, assigned_date: e.target.value })} /></Field>
          <Field label="Deadline"><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></Field>
          <Field label="Marks"><Input type="number" min={0} value={form.marks} onChange={(e) => setForm({ ...form, marks: e.target.value })} /></Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="pending">Pending</option><option value="submitted">Submitted</option>
              <option value="graded">Graded</option><option value="late">Late</option>
            </Select>
          </Field>
        </div>
        <Field label="Submission platform"><Input value={form.submission_platform} onChange={(e) => setForm({ ...form, submission_platform: e.target.value })} /></Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !form.course || !form.title || !form.course_title}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => confirm && del(confirm)}
        message={`Delete "${confirm?.title}"? This cannot be undone.`} />
    </div>
  );
}

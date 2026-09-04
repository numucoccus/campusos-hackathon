'use client';
import { api, fmtDate, ApiError } from '@/lib/api';
import type { Announcement } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, ConfirmDialog, EmptyState, Field, Input, Modal, Select, Skeleton, TextArea } from '@/components/ui';
import { useToast } from '@/components/Toast';

const today = () => new Date().toISOString().slice(0, 10);
const empty = () => ({ title: '', body: '', priority: 'medium', posted_by: 'Dhrubo', date: today(), expires: today() });

export default function AnnouncementsPage() {
  const toast = useToast();
  const [items, setItems] = useState<Announcement[] | null>(null);
  const [priority, setPriority] = useState('');
  const [show, setShow] = useState<'all' | 'active' | 'expired'>('all');
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; item?: Announcement } | null>(null);
  const [confirm, setConfirm] = useState<Announcement | null>(null);
  const [form, setForm] = useState<Record<string, string>>(empty());
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.announcements.list().then(setItems).catch((e) => { setItems([]); toast(e.message, 'error'); });
  }, [toast]);
  useEffect(load, [load]);

  const isExpired = (a: Announcement) => a.expires < today();
  const filtered = useMemo(() => (items ?? []).filter((a) =>
    (!priority || a.priority === priority) &&
    (show === 'all' || (show === 'active' ? !isExpired(a) : isExpired(a)))
  ), [items, priority, show]);

  const openAdd = () => { setForm(empty()); setModal({ mode: 'add' }); };
  const openEdit = (a: Announcement) => {
    setForm({ title: a.title, body: a.body, priority: a.priority, posted_by: a.posted_by, date: a.date, expires: a.expires });
    setModal({ mode: 'edit', item: a });
  };

  const save = async () => {
    setSaving(true);
    try {
      if (modal?.mode === 'add') { await api.announcements.create(form as unknown as Omit<Announcement, 'id'>); toast('Announcement posted'); }
      else if (modal?.item) { await api.announcements.update(modal.item.id, form as Partial<Announcement>); toast('Announcement updated'); }
      setModal(null); load();
    } catch (e) { toast(e instanceof ApiError ? e.message : 'Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const del = async (a: Announcement) => {
    try { await api.announcements.remove(a.id); toast('Announcement deleted'); load(); }
    catch (e) { toast(e instanceof ApiError ? e.message : 'Failed to delete', 'error'); }
  };

  const borderFor = (p: string) => p === 'high' ? '!border-l-danger' : p === 'medium' ? '!border-l-warning' : '!border-l-success';

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="mt-1 text-sm text-muted">Campus notice board</p>
        </div>
        <Button onClick={openAdd}><Plus size={16} /> Post notice</Button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="!w-40">
          <option value="">All priorities</option>
          <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
        </Select>
        <Select value={show} onChange={(e) => setShow(e.target.value as typeof show)} className="!w-40">
          <option value="all">All notices</option><option value="active">Active only</option><option value="expired">Expired only</option>
        </Select>
      </div>

      {items === null ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState message="No announcements match your filters." />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((a) => (
              <motion.div key={a.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}>
                <Card className={`group border-l-4 ${borderFor(a.priority)} ${isExpired(a) ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold">{a.title}</h3>
                        <Badge value={a.priority} />
                        {isExpired(a) && <Badge value="expired" className="!bg-surface-2 !text-muted" />}
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted">{a.body}</p>
                      <p className="mt-2 text-[11px] text-muted">
                        Posted {fmtDate(a.date)} by <span className="font-medium">{a.posted_by}</span> · Expires {fmtDate(a.expires)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                      <button onClick={() => openEdit(a)} className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-accent" aria-label="Edit"><Pencil size={15} /></button>
                      <button onClick={() => setConfirm(a)} className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-danger" aria-label="Delete"><Trash2 size={15} /></button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'add' ? 'Post announcement' : 'Edit announcement'} wide>
        <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Body"><TextArea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-x-3 md:grid-cols-4">
          <Field label="Priority">
            <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
            </Select>
          </Field>
          <Field label="Posted by"><Input value={form.posted_by} onChange={(e) => setForm({ ...form, posted_by: e.target.value })} /></Field>
          <Field label="Date"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Expires"><Input type="date" value={form.expires} onChange={(e) => setForm({ ...form, expires: e.target.value })} /></Field>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !form.title || !form.body || !form.posted_by}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => confirm && del(confirm)}
        message={`Delete "${confirm?.title}"? This cannot be undone.`} />
    </div>
  );
}

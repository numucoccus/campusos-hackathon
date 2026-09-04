'use client';
import { api, ApiError } from '@/lib/api';
import { setAuth } from '@/lib/auth';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Card, Field, Input, PasswordInput } from '@/components/ui';
import { useToast } from '@/components/Toast';

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', student_id: '', email: '', password: '', confirm: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast('Passwords do not match', 'error');
    if (form.password.length < 6) return toast('Password must be at least 6 characters', 'error');
    setBusy(true);
    try {
      const res = await api.auth.register({
        name: form.name, student_id: form.student_id, email: form.email, password: form.password,
      });
      setAuth(res.token, res.user);
      toast(`Account created — welcome, ${res.user.name}!`);
      router.push('/profile');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Registration failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="w-full">
        <Card className="!p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <UserPlus size={22} />
            </div>
            <h1 className="text-xl font-bold">Create your account</h1>
            <p className="mt-1 text-sm text-muted">Book rooms and register for events under your own identity.</p>
          </div>
          <form onSubmit={submit}>
            <Field label="Full name">
              <Input required value={form.name} autoComplete="name"
                onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dhrubo Rahman" />
            </Field>
            <Field label="Student ID">
              <Input required value={form.student_id}
                onChange={(e) => setForm({ ...form, student_id: e.target.value })} placeholder="20-40532" />
            </Field>
            <Field label="Email">
              <Input type="email" required value={form.email} autoComplete="email"
                onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@aust.edu" />
            </Field>
            <div className="grid grid-cols-2 gap-x-3">
              <Field label="Password">
                <PasswordInput required value={form.password} autoComplete="new-password"
                  onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 chars" />
              </Field>
              <Field label="Confirm password">
                <PasswordInput required value={form.confirm} autoComplete="new-password"
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })} placeholder="Repeat it" />
              </Field>
            </div>
            <Button type="submit" disabled={busy || !form.name || !form.student_id || !form.email || !form.password} className="mt-2 w-full">
              {busy ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
          <p className="mt-5 text-center text-xs text-muted">
            Already registered?{' '}
            <Link href="/login" className="font-medium text-accent hover:underline">Sign in</Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}

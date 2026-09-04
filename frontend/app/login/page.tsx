'use client';
import { api, ApiError } from '@/lib/api';
import { setAuth } from '@/lib/auth';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Card, Field, Input } from '@/components/ui';
import { useToast } from '@/components/Toast';

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.auth.login(form);
      setAuth(res.token, res.user);
      toast(`Welcome back, ${res.user.name}!`);
      router.push('/profile');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Sign in failed', 'error');
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
              <LogIn size={22} />
            </div>
            <h1 className="text-xl font-bold">Sign in to CampusOS</h1>
            <p className="mt-1 text-sm text-muted">Your bookings and registrations, under your name.</p>
          </div>
          <form onSubmit={submit}>
            <Field label="Email">
              <Input type="email" required value={form.email} autoComplete="email"
                onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@aust.edu" />
            </Field>
            <Field label="Password">
              <Input type="password" required value={form.password} autoComplete="current-password"
                onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            </Field>
            <Button type="submit" disabled={busy || !form.email || !form.password} className="mt-2 w-full">
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <p className="mt-5 text-center text-xs text-muted">
            No account yet?{' '}
            <Link href="/register" className="font-medium text-accent hover:underline">Create one</Link>
          </p>
          <p className="mt-2 text-center text-[11px] text-muted">
            You can also browse without an account — actions then use the demo identity.
          </p>
        </Card>
      </motion.div>
    </div>
  );
}

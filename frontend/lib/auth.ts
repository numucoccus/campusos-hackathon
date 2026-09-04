'use client';
// Lightweight client-side auth state (token + user in localStorage).
import { useEffect, useState } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  student_id: string;
}

const KEY = 'campusos-auth';
const EVENT = 'campusos-auth-change';

export function getAuth(): { token: string; user: AuthUser } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: AuthUser) {
  localStorage.setItem(KEY, JSON.stringify({ token, user }));
  window.dispatchEvent(new Event(EVENT));
}

export function clearAuth() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}

// Demo identity used when browsing without an account.
export const DEMO_USER: AuthUser = { id: 'demo', email: '', name: 'Dhrubo', student_id: '20-40532' };

export function useAuth() {
  const [auth, setState] = useState<{ token: string; user: AuthUser } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => { setState(getAuth()); setReady(true); };
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  // Validate the stored JWT once on mount; clear it if it is expired/invalid.
  useEffect(() => {
    const current = getAuth();
    if (!current) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/me`, {
      headers: { Authorization: `Bearer ${current.token}` },
    })
      .then((r) => { if (r.status === 401 || r.status === 403) clearAuth(); })
      .catch(() => {});
  }, []);

  return {
    ready,
    user: auth?.user ?? null,
    token: auth?.token ?? null,
    // Identity used for bookings/registrations/agent: signed-in user or demo.
    identity: auth?.user ?? DEMO_USER,
    signedIn: !!auth,
  };
}

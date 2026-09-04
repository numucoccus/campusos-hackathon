'use client';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Gates protected pages: redirects to /login when there is no valid session.
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { ready, signedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !signedIn) router.replace('/login');
  }, [ready, signedIn, router]);

  if (!ready || !signedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
          <p className="text-sm text-muted">Loading…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

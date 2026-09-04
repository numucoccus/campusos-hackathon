'use client';
import { useAuth } from '@/lib/auth';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function Landing() {
  const { ready, signedIn } = useAuth();
  const primaryHref = ready && signedIn ? '/dashboard' : '/login';

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Ambient gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-accent/25 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-accent/15 blur-[110px]" />
        <div className="absolute bottom-10 left-0 h-80 w-80 rounded-full bg-success/10 blur-[110px]" />
      </div>

      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-lg font-bold text-accent-fg">C</div>
          <span className="text-lg font-bold tracking-tight">CampusOS</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-medium text-muted transition hover:text-foreground">
            Sign in
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex min-h-[calc(100vh-5.5rem)] max-w-3xl flex-col items-center justify-center px-6 pb-24 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-xs font-medium text-muted backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Welcome to your campus
        </span>

        <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl">
          Campus<span className="text-accent">OS</span>
        </h1>

        <p className="mt-5 max-w-xl text-balance text-base text-muted md:text-lg">
          One place for everything on campus. Sign in to get started.
        </p>

        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href={primaryHref}
            className="group inline-flex items-center gap-2 rounded-2xl bg-accent px-7 py-3.5 text-sm font-semibold text-accent-fg shadow-lg shadow-accent/20 transition hover:opacity-90 active:scale-[0.98]"
          >
            Get Started
            <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/register"
            className="rounded-2xl border border-border bg-surface/60 px-7 py-3.5 text-sm font-semibold backdrop-blur transition hover:bg-surface-2"
          >
            Create account
          </Link>
        </div>
      </section>
    </main>
  );
}


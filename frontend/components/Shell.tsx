'use client';
import { useAuth } from '@/lib/auth';
import { Bell, Bot, CalendarDays, ClipboardList, DoorOpen, LayoutDashboard, LogIn, PartyPopper } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/schedule', label: 'Schedule', icon: CalendarDays },
  { href: '/rooms', label: 'Rooms', icon: DoorOpen },
  { href: '/events', label: 'Events', icon: PartyPopper },
  { href: '/announcements', label: 'Announcements', icon: Bell },
  { href: '/assignments', label: 'Assignments', icon: ClipboardList },
  { href: '/assistant', label: 'AI Assistant', icon: Bot },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready, signedIn, identity } = useAuth();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-surface md:flex">
        <div className="flex items-center gap-2 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-fg font-bold">C</div>
          <div>
            <div className="text-base font-bold leading-tight">CampusOS</div>
            <div className="text-[11px] text-muted">AUST · Building 7</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'bg-accent-soft text-accent'
                    : 'text-muted hover:bg-surface-2 hover:text-foreground'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border px-4 py-4">
          {!ready ? null : signedIn ? (
            <Link href="/profile" className={`flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-surface-2 ${pathname === '/profile' ? 'bg-accent-soft' : ''}`}>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-sm font-bold text-accent-fg">
                {identity.name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium text-foreground">{identity.name}</span>
                <span className="block text-[11px] text-muted">ID {identity.student_id}</span>
              </span>
            </Link>
          ) : (
            <div className="space-y-1">
              <Link href="/login" className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-xs font-medium text-accent transition hover:bg-surface-2">
                <LogIn size={15} /> Sign in
              </Link>
              <Link href="/profile" className="block truncate px-2 text-[11px] text-muted hover:text-foreground">
                Browsing as {identity.name} (demo)
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col md:pl-60">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-fg text-sm font-bold">C</div>
            <span className="font-bold">CampusOS</span>
          </div>
          <div className="hidden text-sm text-muted md:block">{today}</div>
          <div className="flex items-center gap-2">
            <Link
              href={signedIn ? '/profile' : '/login'}
              aria-label={signedIn ? 'Profile' : 'Sign in'}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-sm font-bold text-accent transition hover:border-accent/50 active:scale-95"
            >
              {ready && signedIn ? identity.name.charAt(0).toUpperCase() : <LogIn size={15} />}
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8">{children}</main>
      </div>

      {/* Floating AI launcher */}
      {pathname !== '/assistant' && (
        <Link
          href="/assistant"
          aria-label="Open AI Assistant"
          className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-fg shadow-lg transition hover:scale-105 active:scale-95 md:bottom-6 md:right-6"
        >
          <Bot size={22} />
        </Link>
      )}

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-border bg-surface py-1.5 md:hidden">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={`rounded-xl p-2.5 ${active ? 'bg-accent-soft text-accent' : 'text-muted'}`}
            >
              <Icon size={20} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

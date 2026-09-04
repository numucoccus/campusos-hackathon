'use client';
import { Bell, Bot, CalendarDays, ClipboardList, DoorOpen, LayoutDashboard, PartyPopper } from 'lucide-react';
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
        <div className="border-t border-border px-6 py-4 text-[11px] text-muted">
          Signed in as <span className="font-medium text-foreground">Dhrubo</span>
          <br />ID 20-40532
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
          <ThemeToggle />
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

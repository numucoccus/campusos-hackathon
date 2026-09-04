'use client';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('campusos-theme', next ? 'dark' : 'light');
    setDark(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="rounded-xl border border-border bg-surface p-2 text-muted transition hover:text-foreground active:scale-95"
    >
      {dark === null ? <Sun size={17} /> : dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

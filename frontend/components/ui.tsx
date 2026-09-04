'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff, X } from 'lucide-react';
import { useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-border bg-surface p-5 shadow-sm transition-shadow ${onClick ? 'cursor-pointer hover:shadow-md' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

const btnVariants: Record<string, string> = {
  primary: 'bg-accent text-accent-fg hover:opacity-90',
  ghost: 'bg-transparent text-foreground hover:bg-surface-2 border border-border',
  danger: 'bg-danger text-white hover:opacity-90',
  soft: 'bg-accent-soft text-accent hover:opacity-85',
};

export function Button({
  variant = 'primary', className = '', ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof btnVariants }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none ${btnVariants[variant]} ${className}`}
    />
  );
}

const badgeColors: Record<string, string> = {
  high: 'bg-danger/15 text-danger',
  medium: 'bg-warning/15 text-warning',
  low: 'bg-success/15 text-success',
  pending: 'bg-warning/15 text-warning',
  submitted: 'bg-success/15 text-success',
  graded: 'bg-accent-soft text-accent',
  late: 'bg-danger/15 text-danger',
  upcoming: 'bg-accent-soft text-accent',
  ongoing: 'bg-success/15 text-success',
  completed: 'bg-surface-2 text-muted',
  cancelled: 'bg-danger/15 text-danger',
  full: 'bg-warning/15 text-warning',
  available: 'bg-success/15 text-success',
  unavailable: 'bg-danger/15 text-danger',
  classroom: 'bg-accent-soft text-accent',
  lab: 'bg-success/15 text-success',
  seminar: 'bg-warning/15 text-warning',
};

export function Badge({ value, className = '' }: { value: string; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${badgeColors[value] || 'bg-surface-2 text-muted'} ${className}`}>
      {value}
    </span>
  );
}

export function Modal({
  open, onClose, title, children, wide = false,
}: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-xl`}
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-foreground" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const fieldCls =
  'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldCls} ${props.className || ''}`} />;
}

export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visible ? 'text' : 'password'} className={`${fieldCls} pr-10 ${props.className || ''}`} />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted transition hover:text-foreground"
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldCls} ${props.className || ''}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${fieldCls} min-h-24 ${props.className || ''}`} />;
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-surface-2 ${className}`} />;
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-14 text-center">
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}

export function ConfirmDialog({
  open, onClose, onConfirm, message,
}: { open: boolean; onClose: () => void; onConfirm: () => void; message: string }) {
  return (
    <Modal open={open} onClose={onClose} title="Are you sure?">
      <p className="mb-5 text-sm text-muted">{message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>Delete</Button>
      </div>
    </Modal>
  );
}

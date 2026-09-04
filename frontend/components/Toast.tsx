'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

interface Toast { id: number; message: string; type: 'success' | 'error' }
const ToastCtx = createContext<(message: string, type?: Toast['type']) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24 }}
              className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg bg-surface border-border ${
                t.type === 'error' ? 'text-danger' : 'text-foreground'
              }`}
            >
              <span className="flex-1">{t.message}</span>
              <button
                onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
                className="text-muted hover:text-foreground"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

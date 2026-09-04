'use client';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { ChatMessage } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, RotateCcw, Send, Sparkles, Wrench } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui';
import { useToast } from '@/components/Toast';

interface UiMessage extends ChatMessage {
  toolCalls?: string[];
}

const SUGGESTIONS = [
  'When is my next class?',
  "What's due this week?",
  'Show high priority announcements',
  'Which labs have a projector and fit 30+?',
  'Book Room 7A02 tomorrow 3–5 PM',
  'Register me for the Deep Learning guest lecture',
];

const toolLabel = (t: string) => t.replace(/_/g, ' ');

export default function AssistantPage() {
  const toast = useToast();
  const { identity } = useAuth();
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    setInput('');
    const next: UiMessage[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await api.chat(
        next.map(({ role, content }) => ({ role, content })),
        { name: identity.name, student_id: identity.student_id },
      );
      setMessages([...next, { role: 'assistant', content: res.reply, toolCalls: res.toolCalls }]);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'The assistant is unavailable. Is the backend running?', 'error');
      setMessages(next);
      setInput(content);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8.5rem)] max-w-3xl flex-col md:h-[calc(100vh-7rem)]">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><Sparkles size={20} className="text-accent" /> AI Assistant</h1>
          <p className="mt-1 text-sm text-muted">Ask about classes, rooms, events, deadlines — it reads and updates live campus data.</p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" onClick={() => setMessages([])} className="!px-3"><RotateCcw size={14} /> New chat</Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-border bg-surface p-4">
        {messages.length === 0 && !busy && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent"><Bot size={26} /></div>
            <p className="text-sm font-medium">Hi {identity.name.split(' ')[0]}! What do you want to know?</p>
            <p className="mt-1 max-w-sm text-xs text-muted">I can check your schedule, find and book rooms, register you for events, and more — always from the latest data.</p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent"><Bot size={16} /></div>
              )}
              <div className={`max-w-[85%] ${m.role === 'user' ? 'order-1' : ''}`}>
                <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === 'user'
                    ? 'bg-accent text-accent-fg rounded-br-md'
                    : 'bg-surface-2 rounded-bl-md'
                }`}>
                  {m.role === 'assistant' ? (
                    <div className="prose-sm [&_a]:text-accent [&_code]:rounded [&_code]:bg-background [&_code]:px-1 [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:my-1 [&_strong]:font-semibold [&_table]:my-2 [&_table]:w-full [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-border [&_th]:bg-background [&_th]:px-2 [&_th]:py-1 [&_ul]:list-disc [&_ul]:pl-4">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
                {m.role === 'assistant' && (m.toolCalls?.length ?? 0) > 0 && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1 pl-1 text-[11px] text-muted">
                    <Wrench size={11} />
                    {Array.from(new Set(m.toolCalls)).map((t) => (
                      <span key={t} className="rounded-md bg-surface-2 px-1.5 py-0.5">{toolLabel(t)}</span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {busy && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent"><Bot size={16} /></div>
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-surface-2 px-4 py-3">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-muted"
                  animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.1, delay: i * 0.18 }} />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => send(s)} disabled={busy}
            className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] text-muted transition hover:border-accent/50 hover:text-accent disabled:opacity-50">
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="mt-2 flex items-end gap-2 rounded-2xl border border-border bg-surface p-2">
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          placeholder="Ask anything about campus… (Enter to send, Shift+Enter for newline)"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
          }}
          className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted"
        />
        <Button onClick={() => send()} disabled={busy || !input.trim()} className="!rounded-xl !px-3.5" aria-label="Send">
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}

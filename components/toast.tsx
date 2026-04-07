'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// ─── Global event bus (no context/provider needed) ────────────────────────────

const listeners = new Set<(toast: Toast) => void>();

export function toast(message: string, type: ToastType = 'info') {
  const t: Toast = { id: Math.random().toString(36).slice(2), message, type };
  listeners.forEach((fn) => fn(t));
}
toast.success = (msg: string) => toast(msg, 'success');
toast.error = (msg: string) => toast(msg, 'error');
toast.warning = (msg: string) => toast(msg, 'warning');

// ─── Renderer component (mount once in layout) ────────────────────────────────

const typeStyles: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-700/40 dark:bg-emerald-900/30 dark:text-emerald-200',
  error:   'border-red-200 bg-red-50 text-red-800 dark:border-red-700/40 dark:bg-red-900/30 dark:text-red-200',
  warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/30 dark:text-amber-200',
  info:    'border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100',
};

const typeIcons: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
};

export function ToastRenderer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (t: Toast) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 4000);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-1/2 z-[60] flex -translate-x-1/2 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg text-sm font-medium animate-fade-in ${typeStyles[t.type]}`}
        >
          <span className="text-base leading-none">{typeIcons[t.type]}</span>
          <span>{t.message}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="ml-2 opacity-50 hover:opacity-100"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

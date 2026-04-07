'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Lead } from '@/lib/types';

interface CommandPaletteProps {
  leads: Lead[];
}

export function CommandPalette({ leads }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const results = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    if (!normalized) return leads.slice(0, 8);
    return leads
      .filter((lead) => [lead.businessName, lead.contactName, lead.city].join(' ').toLowerCase().includes(normalized))
      .slice(0, 12);
  }, [leads, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="mx-auto mt-20 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <input autoFocus className="field" onChange={(event) => setQuery(event.target.value)} placeholder="Search leads..." value={query} />
        <ul className="mt-3 max-h-[60vh] space-y-2 overflow-auto text-sm">
          {results.map((lead) => (
            <li key={lead.id}>
              <Link className="block rounded-lg border border-slate-200 p-3 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800" href={`/leads/${lead.id}`} onClick={() => setOpen(false)}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{lead.businessName}</p>
                  <p className="text-xs text-slate-500">Score {lead.leadScore} · {lead.status}</p>
                </div>
                <p className="text-xs text-slate-500">{lead.contactName} · {lead.city}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

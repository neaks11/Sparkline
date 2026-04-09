'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { loadLeads } from '@/lib/storage';

interface FeedItem {
  id: string;
  leadId: string;
  leadName: string;
  label: string;
  timestamp: string;
  type: 'status' | 'outreach' | 'nurture' | 'import' | 'note' | 'other';
}

function classifyLabel(label: string): FeedItem['type'] {
  const l = label.toLowerCase();
  if (l.includes('status')) return 'status';
  if (l.includes('contacted') || l.includes('follow-up') || l.includes('outreach')) return 'outreach';
  if (l.includes('nurture')) return 'nurture';
  if (l.includes('import') || l.includes('generated') || l.includes('apollo')) return 'import';
  if (l.includes('note')) return 'note';
  return 'other';
}

const TYPE_STYLES: Record<FeedItem['type'], string> = {
  status:   'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300',
  outreach: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  nurture:  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  import:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  note:     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  other:    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

const TYPE_ICONS: Record<FeedItem['type'], string> = {
  status: '🔄', outreach: '📨', nurture: '🌱', import: '⚡', note: '📝', other: '•',
};

const TYPE_FILTERS = ['All', 'status', 'outreach', 'nurture', 'import', 'note'] as const;

export default function ActivityPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<typeof TYPE_FILTERS[number]>('All');

  useEffect(() => {
    const next = loadLeads().flatMap((lead) =>
      lead.activity.map((a) => ({
        id: a.id,
        leadId: lead.id,
        leadName: lead.businessName,
        label: a.label,
        timestamp: a.timestamp,
        type: classifyLabel(a.label),
      }))
    );
    setItems(next);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return items
      .filter((i) => typeFilter === 'All' || i.type === typeFilter)
      .filter((i) => !q || [i.label, i.leadName].join(' ').toLowerCase().includes(q))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [items, query, typeFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: items.length };
    items.forEach((i) => { c[i.type] = (c[i.type] ?? 0) + 1; });
    return c;
  }, [items]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl space-y-4 px-4 py-8 md:px-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Activity Feed</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Full timeline of every action across all leads.
          </p>
        </div>
        <p className="text-sm text-slate-400">{items.length} total events</p>
      </header>

      {/* Filters */}
      <div className="card flex flex-wrap items-center gap-3 p-4">
        <input
          className="field max-w-sm"
          placeholder="Search activity..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-wrap gap-1.5">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium capitalize transition ${
                typeFilter === t
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-900/30 dark:text-brand-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {t === 'All' ? '' : TYPE_ICONS[t as FeedItem['type']]}{' '}{t} {counts[t] ? `(${counts[t]})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="card p-4">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            {items.length === 0
              ? 'No activity yet — generate leads and interact with them to build your timeline.'
              : 'No activity matches your filters.'}
          </div>
        ) : (
          <ul className="relative space-y-0">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-3 bottom-3 w-px bg-slate-200 dark:bg-slate-700" />
            {filtered.map((item, idx) => (
              <li key={item.id} className={`relative flex gap-4 pb-4 ${idx === filtered.length - 1 ? 'pb-0' : ''}`}>
                {/* Dot */}
                <div className={`relative z-10 mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${TYPE_STYLES[item.type]}`}>
                  <span className="leading-none">{TYPE_ICONS[item.type]}</span>
                </div>
                {/* Content */}
                <div className="flex-1 rounded-lg border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.label}</p>
                      <Link
                        href={`/leads/${item.leadId}`}
                        className="mt-0.5 text-xs text-brand-600 hover:underline dark:text-brand-400"
                      >
                        {item.leadName}
                      </Link>
                    </div>
                    <span className="whitespace-nowrap text-xs text-slate-400">
                      {new Date(item.timestamp).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

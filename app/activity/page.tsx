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
}

export default function ActivityPage() {
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    const next = loadLeads().flatMap((lead) => lead.activity.map((activity) => ({
      id: activity.id,
      leadId: lead.id,
      leadName: lead.businessName,
      label: activity.label,
      timestamp: activity.timestamp,
    })));
    setItems(next);
  }, []);

  const sorted = useMemo(() => items.slice().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [items]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl space-y-4 px-4 py-8 md:px-6">
      <header>
        <h1 className="text-3xl font-bold">Activity Feed</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">Timeline of all lead activities.</p>
      </header>
      <div className="card p-4">
        <ul className="space-y-2 text-sm">
          {sorted.map((item) => (
            <li key={item.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-xs text-slate-500">{new Date(item.timestamp).toLocaleString()}</p>
              <p className="mt-1">{item.label}</p>
              <Link className="text-brand-600 text-xs" href={`/leads/${item.leadId}`}>{item.leadName}</Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

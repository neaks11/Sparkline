'use client';

import { useEffect, useMemo, useState } from 'react';
import { loadActivities } from '@/lib/storage';
import { ActivityRecord, ActivityType } from '@/lib/types';

const types: Array<ActivityType | 'All'> = ['All', 'Email', 'Call', 'LinkedIn', 'Note', 'Status Change', 'Task'];

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [type, setType] = useState<ActivityType | 'All'>('All');
  const [query, setQuery] = useState('');

  useEffect(() => {
    setActivities(loadActivities());
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return activities
      .filter((activity) => (type === 'All' ? true : activity.type === type))
      .filter((activity) => [activity.type, activity.summary, activity.outcome ?? ''].join(' ').toLowerCase().includes(normalized))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [activities, query, type]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl space-y-4 px-4 py-8 md:px-6">
      <header>
        <h1 className="text-3xl font-bold">Activities</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">Cross-account timeline of follow-ups and workflow events.</p>
      </header>

      <div className="card flex flex-wrap gap-2 p-4">
        <input className="field max-w-lg" onChange={(event) => setQuery(event.target.value)} placeholder="Search activity notes..." value={query} />
        <select className="field max-w-[180px]" onChange={(event) => setType(event.target.value as ActivityType | 'All')} value={type}>
          {types.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      <div className="card p-4">
        <ul className="space-y-2 text-sm">
          {filtered.map((activity) => (
            <li key={activity.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{activity.type}</p>
                <p className="text-xs text-slate-500">{new Date(activity.timestamp).toLocaleString()}</p>
              </div>
              <p className="mt-1">{activity.summary}</p>
              {activity.outcome && <p className="mt-1 text-xs text-slate-500">Outcome: {activity.outcome}</p>}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

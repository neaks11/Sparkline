'use client';

import { useEffect, useState } from 'react';
import { NICHE_OPTIONS } from '@/lib/niches';

type CustomPainPoints = Record<string, string[]>;

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('sparkline_custom_pain_points');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as CustomPainPoints;
      const next: Record<string, string> = {};
      NICHE_OPTIONS.forEach((niche) => {
        next[niche.toLowerCase()] = (parsed[niche.toLowerCase()] ?? []).join('\n');
      });
      setValues(next);
    } catch {
      // ignore
    }
  }, []);

  const save = () => {
    const payload: CustomPainPoints = {};
    NICHE_OPTIONS.forEach((niche) => {
      const list = (values[niche.toLowerCase()] ?? '').split('\n').map((item) => item.trim()).filter(Boolean);
      payload[niche.toLowerCase()] = list;
    });
    localStorage.setItem('sparkline_custom_pain_points', JSON.stringify(payload));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl space-y-4 px-4 py-8 md:px-6">
      <header>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">Customize niche pain points used by lead/outreach generation.</p>
      </header>
      <div className="card space-y-4 p-6">
        {NICHE_OPTIONS.map((niche) => (
          <div key={niche}>
            <label className="mb-1 block text-sm font-medium">{niche} pain points (one per line)</label>
            <textarea className="field min-h-20" onChange={(event) => setValues((prev) => ({ ...prev, [niche.toLowerCase()]: event.target.value }))} value={values[niche.toLowerCase()] ?? ''} />
          </div>
        ))}
        <div className="flex items-center gap-2">
          <button className="btn-primary" onClick={save}>Save Custom Pain Points</button>
          {saved && <span className="text-sm text-emerald-600 dark:text-emerald-300">Saved</span>}
        </div>
      </div>
    </main>
  );
}

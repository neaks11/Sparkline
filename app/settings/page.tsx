'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { isStandardNiche, MED_SPA_NICHE } from '@/lib/niches';
import { loadSettings, normalizeSettings, resetSettings, saveSettings } from '@/lib/settings';
import { AppSettings } from '@/lib/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [customNiche, setCustomNiche] = useState('');

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  if (!settings) {
    return <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-8 md:px-6">Loading settings...</main>;
  }

  const persist = (next: AppSettings) => {
    const saved = saveSettings(normalizeSettings(next));
    setSettings(saved);
  };

  const toggleActive = (niche: string) => {
    const isActive = settings.activeNiches.includes(niche);
    if (isActive && settings.activeNiches.length === 1) return;

    const activeNiches = isActive
      ? settings.activeNiches.filter((value) => value !== niche)
      : [...settings.activeNiches, niche];

    const defaultNiche = activeNiches.includes(settings.defaultNiche) ? settings.defaultNiche : activeNiches[0];
    persist({ ...settings, activeNiches, defaultNiche, focusMode: 'multi-niche' });
  };

  const removeCustomNiche = (niche: string) => {
    if (niche === MED_SPA_NICHE) return;
    const availableNiches = settings.availableNiches.filter((value) => value !== niche);
    const activeNiches = settings.activeNiches.filter((value) => value !== niche);
    const safeActive = activeNiches.length ? activeNiches : [MED_SPA_NICHE];
    const defaultNiche = safeActive.includes(settings.defaultNiche) ? settings.defaultNiche : safeActive[0];

    persist({ ...settings, availableNiches, activeNiches: safeActive, defaultNiche });
  };

  const addNiche = (event: FormEvent) => {
    event.preventDefault();
    const value = customNiche.trim();
    if (!value) return;
    if (settings.availableNiches.includes(value)) {
      setCustomNiche('');
      return;
    }

    persist({
      ...settings,
      availableNiches: [...settings.availableNiches, value],
      activeNiches: [...settings.activeNiches, value],
    });
    setCustomNiche('');
  };

  const toggleMedSpaOnly = (enabled: boolean) => {
    if (enabled) {
      persist({ ...settings, focusMode: 'med-spa-only', activeNiches: [MED_SPA_NICHE], defaultNiche: MED_SPA_NICHE });
      return;
    }

    persist({
      ...settings,
      focusMode: 'multi-niche',
      activeNiches: settings.activeNiches.length > 0 ? settings.activeNiches : [MED_SPA_NICHE],
      defaultNiche: settings.defaultNiche || MED_SPA_NICHE,
    });
  };

  const reset = () => {
    setSettings(resetSettings());
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl space-y-6 px-4 py-8 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Sparkline Settings</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Configure niche visibility and switch between multi-niche workflows or a dedicated med spa prospecting mode.</p>
        </div>
        <Link href="/" className="btn-secondary">← Back to Dashboard</Link>
      </div>

      <section className="card space-y-5 p-6">
        <div>
          <h2 className="text-xl font-semibold">Niche Management</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Active niches appear in your dashboard filters and search workflow. Med Spa Only Mode streamlines everything around consultation-booking outreach.</p>
        </div>

        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <label className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">Med Spa Only Mode</p>
              <p className="text-sm text-slate-500">Limit active niches to Med Spas and set it as your default niche.</p>
            </div>
            <input type="checkbox" checked={settings.focusMode === 'med-spa-only'} onChange={(e) => toggleMedSpaOnly(e.target.checked)} className="h-5 w-5" />
          </label>
        </div>

        <div className="space-y-3">
          <h3 className="font-medium">Available niches</h3>
          <div className="grid gap-2">
            {settings.availableNiches.map((niche) => {
              const isCustom = !isStandardNiche(niche);
              return (
                <div key={niche} className="flex flex-wrap items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={settings.activeNiches.includes(niche)} onChange={() => toggleActive(niche)} disabled={settings.focusMode === 'med-spa-only' && niche !== MED_SPA_NICHE} />
                    <span>{niche}</span>
                    {niche === settings.defaultNiche && <span className="rounded-full bg-brand-100 px-2 py-1 text-xs text-brand-800 dark:bg-brand-500/20 dark:text-brand-200">Default</span>}
                  </div>

                  <div className="flex gap-2">
                    <button className="btn-secondary" disabled={!settings.activeNiches.includes(niche)} onClick={() => persist({ ...settings, defaultNiche: niche, focusMode: 'multi-niche' })}>Set default</button>
                    {isCustom && <button className="btn-secondary" onClick={() => removeCustomNiche(niche)}>Remove</button>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={addNiche} className="flex flex-wrap gap-2">
          <input className="field flex-1" value={customNiche} onChange={(e) => setCustomNiche(e.target.value)} placeholder="Add custom niche (e.g. Wellness Clinics)" />
          <button className="btn-primary" type="submit">Add niche</button>
        </form>

        <div className="flex justify-end">
          <button className="btn-secondary" onClick={reset}>Reset to standard defaults</button>
        </div>
      </section>
    </main>
  );
}

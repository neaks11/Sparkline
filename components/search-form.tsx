'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AppSettings, LeadSearchInput } from '@/lib/types';

interface SearchFormProps {
  onGenerate: (input: LeadSearchInput) => void;
  loading: boolean;
  settings: AppSettings;
}

export function SearchForm({ onGenerate, loading, settings }: SearchFormProps) {
  const [form, setForm] = useState<LeadSearchInput>({
    niche: settings.defaultNiche,
    city: '',
    state: '',
    purpose: '',
  });

  useEffect(() => {
    const fallbackNiche = settings.activeNiches.includes(form.niche) ? form.niche : settings.defaultNiche;
    setForm((prev) => ({ ...prev, niche: fallbackNiche }));
  }, [settings.activeNiches, settings.defaultNiche, form.niche]);

  const isMedSpaMode = settings.focusMode === 'med-spa-only';
  const hasSingleNiche = settings.activeNiches.length === 1;

  const helperText = useMemo(() => {
    if (isMedSpaMode) {
      return 'Target med spas in your market and prep outreach around consultation booking and front desk automation.';
    }

    return 'Choose an active niche and generate outreach-ready local leads in seconds.';
  }, [isMedSpaMode]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.niche || !form.city || !form.state) return;
    if (!settings.activeNiches.includes(form.niche)) return;
    onGenerate(form);
  };

  return (
    <form onSubmit={submit} className="card grid gap-4 p-6 lg:grid-cols-2">
      <div className="lg:col-span-2 rounded-xl bg-slate-100 p-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
        {helperText}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Niche / Business Type</label>
        {hasSingleNiche ? (
          <input className="field bg-slate-100 dark:bg-slate-800" value={settings.activeNiches[0]} disabled />
        ) : (
          <select className="field" value={form.niche} onChange={(e) => setForm((prev) => ({ ...prev, niche: e.target.value }))}>
            {settings.activeNiches.map((niche) => <option key={niche} value={niche}>{niche}</option>)}
          </select>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">City</label>
        <input className="field" placeholder={isMedSpaMode ? 'e.g. Dallas' : 'e.g. Chicago'} value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">State</label>
        <input className="field" placeholder="e.g. TX" value={form.state} onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Offer / Purpose (optional)</label>
        <input
          className="field"
          placeholder={isMedSpaMode ? 'e.g. missed-call text-back + consultation funnel optimization' : 'Offer angle, package, target outcomes...'}
          value={form.purpose}
          onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))}
        />
        <p className="mt-1 text-xs text-slate-500">{isMedSpaMode ? 'Examples: chatbot for FAQs, booking funnel improvements, review reactivation.' : 'Optional context improves personalization in generated outreach.'}</p>
      </div>

      <div className="lg:col-span-2">
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Generating...' : 'Generate Leads'}
        </button>
      </div>
    </form>
  );
}

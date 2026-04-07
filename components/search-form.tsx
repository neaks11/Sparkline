'use client';

import { FormEvent, useEffect, useState } from 'react';
import { NICHE_OPTIONS } from '@/lib/niches';
import { LeadSearchInput } from '@/lib/types';

interface ProfileDefaults {
  purpose?: string;
  tone?: 'Direct' | 'Friendly' | 'Formal';
}

interface SearchFormProps {
  onGenerate: (input: LeadSearchInput) => void;
  loading: boolean;
  onRerunLast?: () => void;
  hasLastSearch?: boolean;
  profileDefaults?: ProfileDefaults;
}

export function SearchForm({
  onGenerate,
  loading,
  onRerunLast,
  hasLastSearch = false,
  profileDefaults,
}: SearchFormProps) {
  const [form, setForm] = useState<LeadSearchInput>({
    niche: '',
    city: '',
    state: '',
    purpose: profileDefaults?.purpose ?? '',
    tone: profileDefaults?.tone ?? 'Friendly',
    count: 10,
  });

  // When profile defaults arrive (after async load), apply them if fields are still blank
  useEffect(() => {
    if (profileDefaults?.purpose && !form.purpose) {
      setForm((prev) => ({ ...prev, purpose: profileDefaults.purpose ?? '' }));
    }
    if (profileDefaults?.tone) {
      setForm((prev) => ({ ...prev, tone: profileDefaults.tone ?? 'Friendly' }));
    }
  }, [profileDefaults]); // eslint-disable-line react-hooks/exhaustive-deps

  const normalizedNiche = form.niche.trim().toLowerCase();
  const hasValidNiche = NICHE_OPTIONS.some((n) => n.toLowerCase() === normalizedNiche);
  const hasRequiredFields = Boolean(hasValidNiche && form.city.trim() && form.state.trim() && form.purpose.trim());

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!hasRequiredFields) return;
    onGenerate({
      niche: form.niche.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      purpose: form.purpose.trim(),
      tone: form.tone,
      count: form.count,
    });
  };

  return (
    <form onSubmit={submit} className="card grid gap-4 p-6 lg:grid-cols-2">
      {/* Niche */}
      <div>
        <label className="mb-1 block text-sm font-medium">Niche / Business Type</label>
        <input
          className="field"
          list="sparkline-niches"
          placeholder="Search and select a niche"
          value={form.niche}
          onChange={(e) => setForm((prev) => ({ ...prev, niche: e.target.value }))}
        />
        <datalist id="sparkline-niches">
          {NICHE_OPTIONS.map((n) => <option key={n} value={n} />)}
        </datalist>
        {!hasValidNiche && form.niche.trim().length > 0 && (
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-300">
            Choose one of the standard niches from the list.
          </p>
        )}
      </div>

      {/* City */}
      <div>
        <label className="mb-1 block text-sm font-medium">City</label>
        <input
          className="field"
          placeholder="e.g. Chicago"
          value={form.city}
          onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
        />
      </div>

      {/* State */}
      <div>
        <label className="mb-1 block text-sm font-medium">State</label>
        <input
          className="field"
          placeholder="e.g. IL"
          maxLength={2}
          value={form.state}
          onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value.toUpperCase() }))}
        />
      </div>

      {/* Purpose */}
      <div>
        <label className="mb-1 block text-sm font-medium">
          What do you sell / purpose for reaching out?
          {profileDefaults?.purpose && (
            <span className="ml-2 text-xs font-normal text-brand-500">← from your profile</span>
          )}
        </label>
        <input
          className="field"
          placeholder="e.g. AI chat widget setup for HVAC websites to book more calls"
          value={form.purpose}
          onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))}
        />
      </div>

      {/* Lead count */}
      <div>
        <label className="mb-1 block text-sm font-medium">Number of leads (5–25)</label>
        <div className="flex gap-2">
          {[5, 10, 15, 20, 25].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, count: n }))}
              className={`btn-secondary flex-1 ${form.count === n ? '!border-brand-500 !text-brand-600 !bg-brand-50 dark:!bg-brand-900/20' : ''}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Tone */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          Outreach Tone
          {profileDefaults?.tone && (
            <span className="ml-2 text-xs font-normal text-brand-500">← from your profile</span>
          )}
        </label>
        <div className="flex flex-wrap gap-2">
          {(['Direct', 'Friendly', 'Formal'] as const).map((tone) => (
            <button
              key={tone}
              className={`btn-secondary ${form.tone === tone ? '!border-brand-500 !text-brand-600' : ''}`}
              onClick={() => setForm((prev) => ({ ...prev, tone }))}
              type="button"
            >
              {tone}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="lg:col-span-2">
        <div className="flex flex-wrap gap-2">
          <button
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={loading || !hasRequiredFields}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </span>
            ) : 'Generate Leads'}
          </button>
          {hasLastSearch && onRerunLast && (
            <button className="btn-secondary" onClick={onRerunLast} type="button">
              Re-run Last Search
            </button>
          )}
        </div>
        {!hasRequiredFields && (
          <p className="mt-2 text-xs text-slate-500">
            All 4 fields are required, and niche must match one from the list.
          </p>
        )}
      </div>
    </form>
  );
}

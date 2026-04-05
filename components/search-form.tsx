'use client';

import { FormEvent, useState } from 'react';
import { NICHE_OPTIONS } from '@/lib/niches';
import { LeadSearchInput } from '@/lib/types';

interface SearchFormProps {
  onGenerate: (input: LeadSearchInput) => void;
  loading: boolean;
}

export function SearchForm({ onGenerate, loading }: SearchFormProps) {
  const [form, setForm] = useState<LeadSearchInput>({ niche: '', city: '', state: '', purpose: '' });
  const normalizedNiche = form.niche.trim().toLowerCase();
  const hasValidNiche = NICHE_OPTIONS.some((niche) => niche.toLowerCase() === normalizedNiche);
  const hasRequiredFields = Boolean(hasValidNiche && form.city.trim() && form.state.trim() && form.purpose.trim());

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!hasRequiredFields) return;
    onGenerate({
      niche: form.niche.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      purpose: form.purpose.trim(),
    });
  };

  return (
    <form onSubmit={submit} className="card grid gap-4 p-6 lg:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium">Niche / Business Type</label>
        <input className="field" list="sparkline-niches" placeholder="Search and select a niche" value={form.niche} onChange={(e) => setForm((prev) => ({ ...prev, niche: e.target.value }))} />
        <datalist id="sparkline-niches">
          {NICHE_OPTIONS.map((niche) => (
            <option key={niche} value={niche} />
          ))}
        </datalist>
        {!hasValidNiche && form.niche.trim().length > 0 && (
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-300">Choose one of the 10 standard niches from the list.</p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">City</label>
        <input className="field" placeholder="e.g. Chicago" value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">State</label>
        <input className="field" placeholder="e.g. IL" value={form.state} onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">What do you sell / purpose for reaching out?</label>
        <input className="field" placeholder="e.g. AI chat widget setup for HVAC websites to book more calls" value={form.purpose} onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))} />
      </div>
      <div className="lg:col-span-2">
        <button className="btn-primary disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={loading || !hasRequiredFields}>
          {loading ? 'Generating...' : 'Generate Leads'}
        </button>
        {!hasRequiredFields && (
          <p className="mt-2 text-xs text-slate-500">All 4 fields are required, and niche must be selected from the standard list.</p>
        )}
      </div>
    </form>
  );
}

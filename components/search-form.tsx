'use client';

import { FormEvent, useMemo, useState } from 'react';
import { getNichesForIndustry, INDUSTRY_OPTIONS, NICHE_OPTIONS, NicheIndustry } from '@/lib/niches';
import { LeadSearchInput } from '@/lib/types';

interface SearchFormProps {
  onGenerate: (input: LeadSearchInput) => void;
  loading: boolean;
  onRerunLast?: () => void;
  hasLastSearch?: boolean;
}

export function SearchForm({ onGenerate, loading, onRerunLast, hasLastSearch = false }: SearchFormProps) {
  const [industry, setIndustry] = useState<NicheIndustry | ''>('');
  const [form, setForm] = useState<LeadSearchInput>({ niche: '', city: '', state: '', purpose: '', tone: 'Friendly' });

  const availableNiches = useMemo(() => getNichesForIndustry(industry), [industry]);
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
      tone: form.tone,
    });
  };

  const resetNicheSelection = () => {
    setIndustry('');
    setForm((prev) => ({ ...prev, niche: '' }));
  };

  return (
    <form onSubmit={submit} className="card grid gap-4 p-6 lg:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium">Industry (Layer 1)</label>
        <select className="field" onChange={(e) => {
          const nextIndustry = e.target.value as NicheIndustry | '';
          setIndustry(nextIndustry);
          setForm((prev) => ({ ...prev, niche: '' }));
        }} value={industry}>
          <option value="">Select industry</option>
          {INDUSTRY_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Business Niche (Layer 2)</label>
        <div className="flex gap-2">
          <select className="field" disabled={!industry} onChange={(e) => setForm((prev) => ({ ...prev, niche: e.target.value }))} value={form.niche}>
            <option value="">{industry ? 'Select business niche' : 'Choose industry first'}</option>
            {availableNiches.map((niche) => (
              <option key={niche} value={niche}>{niche}</option>
            ))}
          </select>
          <button className="btn-secondary" onClick={resetNicheSelection} type="button">Reset</button>
        </div>
        {!hasValidNiche && form.niche.trim().length > 0 && (
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-300">Choose a valid niche from Layer 2 after selecting an industry.</p>
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
        <label className="mb-2 block text-sm font-medium">Outreach Tone</label>
        <div className="flex flex-wrap gap-2">
          {(['Direct', 'Friendly', 'Formal'] as const).map((tone) => (
            <button key={tone} className={`btn-secondary ${form.tone === tone ? '!border-brand-500 !text-brand-600' : ''}`} onClick={() => setForm((prev) => ({ ...prev, tone }))} type="button">{tone}</button>
          ))}
        </div>
      </div>
      <div className="lg:col-span-2">
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={loading || !hasRequiredFields}>
            {loading ? 'Generating...' : 'Generate Leads'}
          </button>
          {hasLastSearch && onRerunLast && (
            <button className="btn-secondary" onClick={onRerunLast} type="button">Re-run Last Search</button>
          )}
        </div>
        {!hasRequiredFields && (
          <p className="mt-2 text-xs text-slate-500">Industry + business niche + city + state + purpose are required to generate leads.</p>
        )}
      </div>
    </form>
  );
}

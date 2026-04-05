'use client';

import { FormEvent, useState } from 'react';
import { LeadSearchInput } from '@/lib/types';

interface SearchFormProps {
  onGenerate: (input: LeadSearchInput) => void;
  loading: boolean;
}

export function SearchForm({ onGenerate, loading }: SearchFormProps) {
  const [form, setForm] = useState<LeadSearchInput>({ niche: '', city: '', state: '', notes: '' });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.niche || !form.city || !form.state) return;
    onGenerate(form);
  };

  return (
    <form onSubmit={submit} className="card grid gap-4 p-6 lg:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium">Niche / Business Type</label>
        <input className="field" placeholder="e.g. HVAC companies" value={form.niche} onChange={(e) => setForm((prev) => ({ ...prev, niche: e.target.value }))} />
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
        <label className="mb-1 block text-sm font-medium">Notes (optional)</label>
        <input className="field" placeholder="Offer angle, package, target outcomes..." value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
      </div>
      <div className="lg:col-span-2">
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Generating...' : 'Generate Leads'}
        </button>
      </div>
    </form>
  );
}

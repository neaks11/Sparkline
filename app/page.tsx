'use client';

import { useMemo, useState } from 'react';
import { LeadsTable } from '@/components/leads-table';
import { SearchForm } from '@/components/search-form';
import { ThemeToggle } from '@/components/theme-toggle';
import { exportLeadsCsv } from '@/lib/export';
import { generateSampleLeads } from '@/lib/lead-generator';
import { saveLeads } from '@/lib/storage';
import { Lead, LeadSearchInput } from '@/lib/types';

export default function HomePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [query, setQuery] = useState('');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
  const [isLoading, setIsLoading] = useState(false);

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    const result = leads.filter((lead) => [lead.businessName, lead.contactName, lead.city, lead.status].join(' ').toLowerCase().includes(normalized));
    return result.sort((a, b) => sortDirection === 'desc' ? b.leadScore - a.leadScore : a.leadScore - b.leadScore);
  }, [leads, query, sortDirection]);

  const generate = async (input: LeadSearchInput) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const fresh = generateSampleLeads(input);
    setLeads(fresh);
    saveLeads(fresh);
    setIsLoading(false);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 md:px-6">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">LeadForge</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Find better leads. Reach out smarter.</p>
        </div>
        <ThemeToggle />
      </header>

      <section className="space-y-6">
        <SearchForm onGenerate={generate} loading={isLoading} />

        <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex w-full max-w-xl gap-2">
            <input className="field" placeholder="Search by business, contact, city, or status" value={query} onChange={(e) => setQuery(e.target.value)} />
            <button className="btn-secondary" onClick={() => setSortDirection((prev) => prev === 'desc' ? 'asc' : 'desc')}>
              Sort Score: {sortDirection === 'desc' ? 'High→Low' : 'Low→High'}
            </button>
          </div>
          <button className="btn-primary" onClick={() => exportLeadsCsv(filtered)} disabled={!filtered.length}>Export CSV</button>
        </div>

        <LeadsTable leads={filtered} />
      </section>
    </main>
  );
}

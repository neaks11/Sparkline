'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { LeadsTable } from '@/components/leads-table';
import { SearchForm } from '@/components/search-form';
import { ThemeToggle } from '@/components/theme-toggle';
import { exportLeadsCsv } from '@/lib/export';
import { generateSampleLeads } from '@/lib/lead-generator';
import { loadSettings } from '@/lib/settings';
import { loadLeads, saveLeads } from '@/lib/storage';
import { AppSettings, Lead, LeadSearchInput } from '@/lib/types';

export default function HomePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [query, setQuery] = useState('');
  const [nicheFilter, setNicheFilter] = useState('all');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setLeads(loadLeads());
    setSettings(loadSettings());
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    const result = leads.filter((lead) => {
      const searchable = [lead.businessName, lead.contactName, lead.city, lead.status].join(' ').toLowerCase();
      const queryMatch = searchable.includes(normalized);
      const nicheMatch = nicheFilter === 'all' ? true : lead.niche === nicheFilter;
      return queryMatch && nicheMatch;
    });

    return result.sort((a, b) => sortDirection === 'desc' ? b.leadScore - a.leadScore : a.leadScore - b.leadScore);
  }, [leads, query, nicheFilter, sortDirection]);

  const generate = async (input: LeadSearchInput) => {
    if (!settings || !settings.activeNiches.includes(input.niche)) return;
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const fresh = generateSampleLeads(input);
    setLeads(fresh);
    saveLeads(fresh);
    setIsLoading(false);
  };

  if (!settings) {
    return <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 md:px-6">Loading Sparkline...</main>;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 md:px-6">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sparkline</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Find better leads. Reach out smarter.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/settings" className="btn-secondary">Settings</Link>
          <ThemeToggle />
        </div>
      </header>

      <section className="space-y-6">
        <SearchForm onGenerate={generate} loading={isLoading} settings={settings} />

        <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex w-full flex-wrap gap-2 lg:w-auto">
            <input className="field w-full lg:w-80" placeholder="Search by business, contact, city, or status" value={query} onChange={(e) => setQuery(e.target.value)} />
            <select className="field w-full lg:w-56" value={nicheFilter} onChange={(e) => setNicheFilter(e.target.value)}>
              <option value="all">All active niches</option>
              {settings.activeNiches.map((niche) => <option key={niche} value={niche}>{niche}</option>)}
            </select>
            <button className="btn-secondary" onClick={() => setSortDirection((prev) => prev === 'desc' ? 'asc' : 'desc')}>
              Sort Score: {sortDirection === 'desc' ? 'High→Low' : 'Low→High'}
            </button>
          </div>
          <button className="btn-primary" onClick={() => exportLeadsCsv(filtered)} disabled={!filtered.length}>Export CSV</button>
        </div>

        <LeadsTable
          leads={filtered}
          emptyMessage={settings.focusMode === 'med-spa-only'
            ? 'No med spa leads yet. Generate a city list to start building outreach for consultation bookings and front desk follow-up.'
            : undefined}
        />
      </section>
    </main>
  );
}

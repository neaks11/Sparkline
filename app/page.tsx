'use client';

import { useEffect, useMemo, useState } from 'react';
import { LeadsTable } from '@/components/leads-table';
import { SearchForm } from '@/components/search-form';
import { SparklineLogo } from '@/components/sparkline-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { mapLeadActivities, mapLeadToAccount } from '@/lib/accounts';
import { exportLeadsCsv } from '@/lib/export';
import { generateSampleLeads } from '@/lib/lead-generator';
import { loadActivities, loadLeads, saveAccounts, saveActivities, saveLeads } from '@/lib/storage';
import { Lead, LeadSearchInput, LeadStatus } from '@/lib/types';

export default function HomePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [query, setQuery] = useState('');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'All'>('All');
  const [minScore, setMinScore] = useState(65);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setLeads(loadLeads());
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    const result = leads.filter((lead) => {
      const matchesQuery = [lead.businessName, lead.contactName, lead.city, lead.status].join(' ').toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
      const matchesScore = lead.leadScore >= minScore;
      return matchesQuery && matchesStatus && matchesScore;
    });
    return result.sort((a, b) => sortDirection === 'desc' ? b.leadScore - a.leadScore : a.leadScore - b.leadScore);
  }, [leads, minScore, query, sortDirection, statusFilter]);

  const generate = async (input: LeadSearchInput) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const fresh = generateSampleLeads(input);
    setLeads(fresh);
    saveLeads(fresh);
    saveAccounts(fresh.map(mapLeadToAccount));
    saveActivities(fresh.flatMap(mapLeadActivities));
    setIsLoading(false);
  };

  const updateLead = (updated: Lead) => {
    const next = leads.map((lead) => lead.id === updated.id ? {
      ...updated,
      activity: [
        ...updated.activity,
        { id: crypto.randomUUID(), label: `Status updated to ${updated.status} from dashboard`, timestamp: new Date().toISOString() },
      ],
    } : lead);
    setLeads(next);
    saveLeads(next);
    saveAccounts(next.map(mapLeadToAccount));
    saveActivities(next.flatMap(mapLeadActivities));
  };

  const totalLeads = leads.length;
  const highIntent = leads.filter((lead) => lead.leadScore >= 85).length;
  const averageScore = totalLeads ? Math.round(leads.reduce((sum, lead) => sum + lead.leadScore, 0) / totalLeads) : 0;

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 md:px-6">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <SparklineLogo />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="brand-gradient-text">Sparkline</span>
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">Find better leads. Reach out smarter.</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <section className="space-y-6">
        <SearchForm onGenerate={generate} loading={isLoading} />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="card p-4">
            <p className="text-xs uppercase text-slate-500">Total Leads</p>
            <p className="mt-1 text-2xl font-bold">{totalLeads}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs uppercase text-slate-500">High Intent (85+)</p>
            <p className="mt-1 text-2xl font-bold">{highIntent}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs uppercase text-slate-500">Average Score</p>
            <p className="mt-1 text-2xl font-bold">{averageScore || '—'}</p>
          </div>
        </div>

        <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex w-full max-w-4xl flex-wrap gap-2">
            <input className="field disabled:cursor-not-allowed disabled:opacity-60" disabled={isLoading} placeholder="Search by business, contact, city, or status" value={query} onChange={(e) => setQuery(e.target.value)} />
            <select className="field max-w-[180px] disabled:cursor-not-allowed disabled:opacity-60" disabled={isLoading} onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'All')} value={statusFilter}>
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Ready">Ready</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Proposal Sent">Proposal Sent</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
            <input
              className="field max-w-[130px] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
              max={99}
              min={65}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (Number.isNaN(next)) return;
                setMinScore(Math.max(65, Math.min(99, next)));
              }}
              type="number"
              value={minScore}
            />
            <button className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60" disabled={isLoading} onClick={() => setSortDirection((prev) => prev === 'desc' ? 'asc' : 'desc')}>
              Sort Score: {sortDirection === 'desc' ? 'High→Low' : 'Low→High'}
            </button>
            <button className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60" disabled={isLoading} onClick={() => {
              setQuery('');
              setStatusFilter('All');
              setMinScore(65);
            }}>
              Clear Filters
            </button>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary disabled:cursor-not-allowed disabled:opacity-60" onClick={() => exportLeadsCsv(filtered)} disabled={!filtered.length || isLoading}>
              {isLoading ? 'Generating...' : 'Export CSV'}
            </button>
            <button className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60" disabled={!leads.length || isLoading} onClick={() => {
              setLeads([]);
              saveLeads([]);
              saveAccounts([]);
              const activityWithoutLeadEvents = loadActivities().filter((item) => !leads.find((lead) => lead.id === item.accountId));
              saveActivities(activityWithoutLeadEvents);
            }}>
              Clear Leads
            </button>
          </div>
        </div>

        <LeadsTable leads={filtered} loading={isLoading} onUpdateLead={updateLead} />
      </section>
    </main>
  );
}

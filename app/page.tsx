'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CommandPalette } from '@/components/command-palette';
import { LeadsTable } from '@/components/leads-table';
import { PipelineChart } from '@/components/pipeline-chart';
import { SearchForm } from '@/components/search-form';
import { SparklineLogo } from '@/components/sparkline-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { useDebounce } from '@/hooks/use-debounce';
import { mapLeadActivities, mapLeadToAccount } from '@/lib/accounts';
import { exportLeadsCsv } from '@/lib/export';
import { parseLeadsCsv } from '@/lib/import';
import { generateSampleLeads } from '@/lib/lead-generator';
import {
  appendLeads, appendSession, exportBackup, importBackup,
  loadActivities, loadGoal, loadLeads, loadProfile, loadSessions,
  saveAccounts, saveActivities, saveGoal, saveLeads,
} from '@/lib/storage';
import { Lead, LeadSearchInput, LeadStatus, UserProfile } from '@/lib/types';
import { toast } from '@/components/toast';
import { QuickAddLeadModal } from '@/components/quick-add-lead-modal';

const statuses: Array<LeadStatus | 'All' | 'Due Today' | 'Stale (14+ days)'> = [
  'All', 'New', 'Ready', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost', 'Due Today', 'Stale (14+ days)',
];
const sourceOptions: Array<Lead['source'] | 'All'> = [
  'All', 'Generated', 'Manual', 'CSV Import', 'LinkedIn', 'Referral',
];

function isStaleLead(lead: Lead): boolean {
  if (lead.status === 'Won' || lead.status === 'Lost') return false;
  const last = lead.activity.at(-1);
  if (!last) return false;
  return Date.now() - new Date(last.timestamp).getTime() > 14 * 24 * 60 * 60 * 1000;
}

function isDueToday(lead: Lead): boolean {
  if (!lead.followUpDate) return false;
  const target = new Date(lead.followUpDate);
  const today = new Date();
  return target.toDateString() === today.toDateString();
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (!parts[0]) return '?';
  return parts.length === 1 ? parts[0][0].toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function HomePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
  const [statusFilter, setStatusFilter] = useState<(typeof statuses)[number]>('All');
  const [sourceFilter, setSourceFilter] = useState<(typeof sourceOptions)[number]>('All');
  const [minScore, setMinScore] = useState(65);
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [lastSource, setLastSource] = useState<'apollo' | 'mock' | null>(null);
  const [apolloPlanRequired, setApolloPlanRequired] = useState(false);
  const [sessions, setSessions] = useState<ReturnType<typeof loadSessions>>([]);
  const [goal, setGoal] = useState(25);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLeads(loadLeads());
    setSessions(loadSessions());
    setGoal(loadGoal().monthly);
    setProfile(loadProfile());
    // Pick up any pending search fired from chat assistant on another page
    const pending = sessionStorage.getItem('sparkline_pending_search');
    if (pending) {
      sessionStorage.removeItem('sparkline_pending_search');
      try {
        const input = JSON.parse(pending) as LeadSearchInput;
        if (input?.niche && input?.city) {
          setTimeout(() => void generate(input), 400);
        }
      } catch { /* ignore */ }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for chat assistant generate events
  useEffect(() => {
    const handler = (e: Event) => {
      const input = (e as CustomEvent<LeadSearchInput>).detail;
      if (input?.niche && input?.city) {
        void generate(input);
      }
    };
    window.addEventListener('sparkline:generate', handler);
    const planHandler = () => setApolloPlanRequired(true);
    window.addEventListener('sparkline:apollo-plan-required', planHandler);
    return () => {
      window.removeEventListener('sparkline:generate', handler);
      window.removeEventListener('sparkline:apollo-plan-required', planHandler);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pipelineCounts = useMemo<Record<LeadStatus, number>>(() => ({
    New: leads.filter((l) => l.status === 'New').length,
    Ready: leads.filter((l) => l.status === 'Ready').length,
    Contacted: leads.filter((l) => l.status === 'Contacted').length,
    Qualified: leads.filter((l) => l.status === 'Qualified').length,
    'Proposal Sent': leads.filter((l) => l.status === 'Proposal Sent').length,
    Won: leads.filter((l) => l.status === 'Won').length,
    Lost: leads.filter((l) => l.status === 'Lost').length,
  }), [leads]);

  const filtered = useMemo(() => {
    const normalized = debouncedQuery.toLowerCase().trim();
    const result = leads.filter((lead) => {
      const matchesQuery = [lead.businessName, lead.contactName, lead.city, lead.status]
        .join(' ').toLowerCase().includes(normalized);
      const matchesScore = lead.leadScore >= minScore;
      const matchesStatus = statusFilter === 'All'
        ? true
        : statusFilter === 'Due Today'
          ? isDueToday(lead)
          : statusFilter === 'Stale (14+ days)'
            ? isStaleLead(lead)
            : lead.status === statusFilter;
      const matchesSource = sourceFilter === 'All' || lead.source === sourceFilter;
      return matchesQuery && matchesScore && matchesStatus && matchesSource;
    });
    return result.sort((a, b) =>
      sortDirection === 'desc' ? b.leadScore - a.leadScore : a.leadScore - b.leadScore
    );
  }, [debouncedQuery, leads, minScore, sortDirection, sourceFilter, statusFilter]);

  const persist = (next: Lead[]) => {
    setLeads(next);
    saveLeads(next);
    saveAccounts(next.map(mapLeadToAccount));
    saveActivities(next.flatMap(mapLeadActivities));
  };

  const generate = async (input: LeadSearchInput) => {
    setIsLoading(true);
    const sessionId = crypto.randomUUID();
    const { leads: fresh, source } = await generateSampleLeads(input, sessionId);
    const merged = [...loadLeads(), ...fresh];
    persist(merged);
    setLastSource(source);
    const duplicateCount = fresh.filter((lead) =>
      lead.activity.some((item) => item.label.includes('Duplicate detected'))
    ).length;
    setDuplicateWarning(duplicateCount ? `${duplicateCount} duplicate names were detected and renamed.` : '');
    setSessions(
      appendSession({
        id: sessionId,
        createdAt: new Date().toISOString(),
        source,
        input: { ...input, tone: input.tone ?? 'Direct', count: input.count ?? 10 },
        duplicateCount,
        leadCount: fresh.length,
      })
    );
    toast.success(`${fresh.length} ${input.niche} leads generated in ${input.city}, ${input.state}!`);
    setIsLoading(false);
  };

  const updateLead = (updated: Lead) => {
    const next = leads.map((lead) =>
      lead.id === updated.id
        ? {
            ...updated,
            activity: [
              ...updated.activity,
              {
                id: crypto.randomUUID(),
                label: `Status updated to ${updated.status} from dashboard`,
                timestamp: new Date().toISOString(),
              },
            ],
          }
        : lead
    );
    persist(next);
  };

  const runImportCsv = async (file: File) => {
    const text = await file.text();
    const imported = parseLeadsCsv(text);
    const merged = appendLeads(imported);
    persist(merged);
  };

  const totalLeads = leads.length;
  const highIntent = leads.filter((l) => l.leadScore >= 85).length;
  const averageScore = totalLeads
    ? Math.round(leads.reduce((sum, l) => sum + l.leadScore, 0) / totalLeads)
    : 0;
  const thisMonthContacted = leads.filter((lead) => {
    if (lead.status !== 'Contacted') return false;
    const created = new Date(lead.createdAt);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;
  const goalProgress = Math.min(100, Math.round((thisMonthContacted / Math.max(goal, 1)) * 100));

  const grouped = useMemo(() => {
    return (['New', 'Ready', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'] as LeadStatus[]).map(
      (status) => ({ status, leads: filtered.filter((l) => l.status === status) })
    );
  }, [filtered]);

  const batchStats = useMemo(() => {
    return sessions.map((session) => {
      const batch = leads.filter((l) => l.batchId === session.id);
      const won = batch.filter((l) => l.status === 'Won').length;
      const contacted = batch.filter((l) => l.status === 'Contacted').length;
      const avgScore = batch.length
        ? Math.round(batch.reduce((sum, l) => sum + l.leadScore, 0) / batch.length)
        : 0;
      return { session, won, contacted, avgScore };
    });
  }, [leads, sessions]);

  const wonCount = leads.filter((l) => l.status === 'Won').length;
  const lostCount = leads.filter((l) => l.status === 'Lost').length;
  const closeRate = wonCount + lostCount > 0
    ? Math.round((wonCount / (wonCount + lostCount)) * 100)
    : 0;

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 md:px-6">
      <CommandPalette leads={leads} />

      {/* Header */}
      <header className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <SparklineLogo />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="brand-gradient-text">Sparkline</span>
            </h1>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              {profile?.companyName
                ? `${profile.companyName} · Find better leads. Reach out smarter.`
                : 'Find better leads. Reach out smarter.'}
            </p>
            <p className="mt-1 text-xs text-slate-500">Press ⌘K / Ctrl+K to search instantly.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {profile && (
            <Link href="/settings/profile" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: profile.avatarColor ?? '#6366f1' }}
              >
                {getInitials(profile.fullName)}
              </span>
              {profile.fullName.split(' ')[0]}
            </Link>
          )}
          <Link className="btn-secondary" href="/activity">Activity</Link>
          <ThemeToggle />
        </div>
      </header>

      <section className="space-y-6">
        <SearchForm
          hasLastSearch={sessions.length > 0}
          loading={isLoading}
          onGenerate={generate}
          onRerunLast={() => sessions[0] && generate({ ...sessions[0].input, count: sessions[0].input.count ?? 10 })}
          profileDefaults={profile ? {
            purpose: profile.productService,
            tone: profile.defaultTone,
          } : undefined}
        />

        {/* Source / Apollo status badge */}
        {apolloPlanRequired && (
          <div className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            🔑 Apollo key valid — people search requires a paid plan.{' '}
            <a href="https://app.apollo.io/#/settings/plans/upgrade" target="_blank" rel="noreferrer" className="underline hover:no-underline">
              Upgrade here
            </a>
          </div>
        )}
        {!apolloPlanRequired && lastSource && (
          <div className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium ${
            lastSource === 'apollo'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-300'
              : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            <span className={`h-2 w-2 rounded-full ${lastSource === 'apollo' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {lastSource === 'apollo' ? '🟢 Live data from Apollo' : '⚪ Mock data — add Apollo API key for real leads'}
          </div>
        )}

        {duplicateWarning && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300">
            {duplicateWarning}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="card p-4 lg:col-span-1">
            <p className="text-xs uppercase text-slate-500">Total Leads</p>
            <p className="mt-1 text-2xl font-bold">{totalLeads}</p>
          </div>
          <div className="card p-4 lg:col-span-1">
            <p className="text-xs uppercase text-slate-500">High Intent</p>
            <p className="mt-1 text-2xl font-bold">{highIntent}</p>
            <p className="text-xs text-slate-400">Score 85+</p>
          </div>
          <div className="card p-4 lg:col-span-1">
            <p className="text-xs uppercase text-slate-500">Avg Score</p>
            <p className="mt-1 text-2xl font-bold">{averageScore || '—'}</p>
          </div>
          <div className="card p-4 lg:col-span-1">
            <p className="text-xs uppercase text-slate-500">Won</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{wonCount}</p>
          </div>
          <div className="card p-4 lg:col-span-1">
            <p className="text-xs uppercase text-slate-500">Close Rate</p>
            <p className="mt-1 text-2xl font-bold">{wonCount + lostCount > 0 ? `${closeRate}%` : '—'}</p>
          </div>
          <div className="card p-4 lg:col-span-1">
            <p className="text-xs uppercase text-slate-500">Monthly Goal</p>
            <p className="mt-1 text-2xl font-bold">{thisMonthContacted} / {goal}</p>
            <input
              className="field mt-2 text-xs"
              min={1}
              onChange={(e) => {
                const monthly = Number(e.target.value) || 1;
                setGoal(monthly);
                saveGoal({ monthly });
              }}
              type="number"
              value={goal}
            />
            <div className="mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${goalProgress}%` }} />
            </div>
          </div>
        </div>

        <PipelineChart counts={pipelineCounts} />

        {/* Filter bar */}
        <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex w-full max-w-5xl flex-wrap gap-2">
            <input
              className="field disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by business, contact, city, or status"
              value={query}
            />
            <select
              className="field max-w-[200px]"
              onChange={(e) => setStatusFilter(e.target.value as (typeof statuses)[number])}
              value={statusFilter}
            >
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              className="field max-w-[160px]"
              onChange={(e) => setSourceFilter(e.target.value as (typeof sourceOptions)[number])}
              value={sourceFilter}
            >
              {sourceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input
              className="field max-w-[130px]"
              max={99}
              min={65}
              onChange={(e) => setMinScore(Math.max(65, Math.min(99, Number(e.target.value) || 65)))}
              type="number"
              value={minScore}
            />
            <button
              className="btn-secondary"
              onClick={() => setSortDirection((p) => p === 'desc' ? 'asc' : 'desc')}
            >
              Sort Score: {sortDirection === 'desc' ? 'High→Low' : 'Low→High'}
            </button>
            <button
              className="btn-secondary"
              onClick={() => { setQuery(''); setStatusFilter('All'); setSourceFilter('All'); setMinScore(65); }}
            >
              Clear Filters
            </button>
            <button
              className={`btn-secondary ${view === 'table' ? '!border-brand-500 !text-brand-600' : ''}`}
              onClick={() => setView('table')}
            >
              Table
            </button>
            <button
              className={`btn-secondary ${view === 'kanban' ? '!border-brand-500 !text-brand-600' : ''}`}
              onClick={() => setView('kanban')}
            >
              Kanban
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={() => setShowQuickAdd(true)}>+ Add Lead</button>
            <button
              className="btn-primary"
              disabled={!filtered.length || isLoading}
              onClick={() => exportLeadsCsv(filtered)}
            >
              {isLoading ? 'Generating...' : 'Export CSV'}
            </button>
            <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>Import CSV</button>
            <button className="btn-secondary" onClick={exportBackup}>Export Backup</button>
            <button className="btn-secondary" onClick={() => backupInputRef.current?.click()}>Import Backup</button>
            <button
              className="btn-secondary text-red-500 hover:border-red-300"
              disabled={!leads.length || isLoading}
              onClick={() => {
                if (!confirm('Clear all leads? This cannot be undone.')) return;
                setLeads([]);
                saveLeads([]);
                saveAccounts([]);
                const surviving = loadActivities().filter((a) => !leads.find((l) => l.id === a.accountId));
                saveActivities(surviving);
              }}
            >
              Clear Leads
            </button>
          </div>
        </div>

        <input
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void runImportCsv(file);
            e.currentTarget.value = '';
          }}
          ref={fileInputRef}
          type="file"
        />
        <input
          accept=".json"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              const text = await file.text();
              importBackup(JSON.parse(text) as { leads?: Lead[]; sessions?: ReturnType<typeof loadSessions> });
              setLeads(loadLeads());
              setSessions(loadSessions());
            }
            e.currentTarget.value = '';
          }}
          ref={backupInputRef}
          type="file"
        />

        {/* Lead views */}
        {view === 'table' ? (
          <LeadsTable
            leads={filtered}
            loading={isLoading}
            onBulkDelete={(ids) => persist(leads.filter((l) => !ids.includes(l.id)))}
            onBulkExport={(ids) => exportLeadsCsv(leads.filter((l) => ids.includes(l.id)))}
            onBulkUpdate={(ids, status) => persist(leads.map((l) => ids.includes(l.id) ? { ...l, status } : l))}
            onUpdateLead={updateLead}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {grouped.map((lane) => (
              <div key={lane.status} className="card p-3">
                <h3 className="mb-2 text-sm font-semibold">{lane.status} ({lane.leads.length})</h3>
                <div className="space-y-2">
                  {lane.leads.map((lead) => (
                    <Link
                      key={lead.id}
                      className="block rounded-lg border border-slate-200 p-3 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      href={`/leads/${lead.id}`}
                    >
                      <p className="font-medium">{lead.businessName}</p>
                      <p className="text-xs text-slate-500">{lead.contactName} · Score {lead.leadScore}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Session history */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold">Session History</h3>
          {batchStats.length === 0 ? (
            <p className="mt-2 text-xs text-slate-400">No searches yet. Generate leads above or use the AI assistant →</p>
          ) : (
            <ul className="mt-2 space-y-2 text-xs">
              {batchStats.map(({ session, won, contacted, avgScore }) => (
                <li key={session.id} className="rounded border border-slate-200 p-2 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{session.input.niche} in {session.input.city}, {session.input.state}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      session.source === 'apollo'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                    }`}>
                      {session.source === 'apollo' ? 'Apollo' : 'Mock'}
                    </span>
                  </div>
                  <p className="text-slate-500">Won: {won} | Contacted: {contacted} | Avg Score: {avgScore || '—'} | Leads: {session.leadCount ?? '?'}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <QuickAddLeadModal
        open={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onAdd={(lead) => persist([...loadLeads(), lead])}
      />
    </main>
  );
}

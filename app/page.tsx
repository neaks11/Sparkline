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
import { appendLeads, appendSession, exportBackup, importBackup, loadActivities, loadGoal, loadLeads, loadSessions, saveAccounts, saveActivities, saveGoal, saveLeads } from '@/lib/storage';
import { Lead, LeadSearchInput, LeadStatus } from '@/lib/types';

const statuses: Array<LeadStatus | 'All' | 'Due Today' | 'Stale (14+ days)'> = ['All', 'New', 'Ready', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost', 'Due Today', 'Stale (14+ days)'];
const sourceOptions: Array<Lead['source'] | 'All'> = ['All', 'Generated', 'Manual', 'CSV Import', 'LinkedIn', 'Referral'];

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

export default function HomePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
  const [statusFilter, setStatusFilter] = useState<(typeof statuses)[number]>('All');
  const [sourceFilter, setSourceFilter] = useState<(typeof sourceOptions)[number]>('All');
  const [minScore, setMinScore] = useState(65);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [sessions, setSessions] = useState(loadSessions());
  const [goal, setGoal] = useState(loadGoal().monthly);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const [undoSnapshot, setUndoSnapshot] = useState<Lead[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLeads(loadLeads());
    setSessions(loadSessions());
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const pipelineCounts = useMemo<Record<LeadStatus, number>>(() => ({
    New: leads.filter((lead) => lead.status === 'New').length,
    Ready: leads.filter((lead) => lead.status === 'Ready').length,
    Contacted: leads.filter((lead) => lead.status === 'Contacted').length,
    Qualified: leads.filter((lead) => lead.status === 'Qualified').length,
    'Proposal Sent': leads.filter((lead) => lead.status === 'Proposal Sent').length,
    Won: leads.filter((lead) => lead.status === 'Won').length,
    Lost: leads.filter((lead) => lead.status === 'Lost').length,
  }), [leads]);

  const filtered = useMemo(() => {
    const normalized = debouncedQuery.toLowerCase().trim();
    const result = leads.filter((lead) => {
      const matchesQuery = [lead.businessName, lead.contactName, lead.city, lead.status].join(' ').toLowerCase().includes(normalized);
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
    return result.sort((a, b) => sortDirection === 'desc' ? b.leadScore - a.leadScore : a.leadScore - b.leadScore);
  }, [debouncedQuery, leads, minScore, sortDirection, sourceFilter, statusFilter]);

  const persist = (next: Lead[]) => {
    setLeads(next);
    saveLeads(next);
    saveAccounts(next.map(mapLeadToAccount));
    saveActivities(next.flatMap(mapLeadActivities));
  };

  const generate = async (input: LeadSearchInput) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const sessionId = crypto.randomUUID();
    const fresh = generateSampleLeads(input).map((lead) => ({ ...lead, batchId: sessionId }));
    const merged = [...loadLeads(), ...fresh];
    persist(merged);
    const duplicateCount = fresh.filter((lead) => lead.activity.some((item) => item.label.includes('Duplicate detected'))).length;
    setDuplicateWarning(duplicateCount ? `${duplicateCount} duplicate names were detected and renamed.` : '');
    setSessions(appendSession({ id: sessionId, createdAt: new Date().toISOString(), input, duplicateCount }));
    setIsLoading(false);
  };

  const updateLead = (updated: Lead) => {
    const requiresFollowUp = (updated.status === 'Qualified' || updated.status === 'Proposal Sent') && !updated.followUpDate;
    const nextLead = requiresFollowUp
      ? {
        ...updated,
        followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        activity: [...updated.activity, { id: crypto.randomUUID(), label: 'Follow-up date auto-set for active pipeline stage', timestamp: new Date().toISOString() }],
      }
      : updated;

    const next = leads.map((lead) => lead.id === updated.id ? {
      ...nextLead,
      activity: [...nextLead.activity, { id: crypto.randomUUID(), label: `Status updated to ${nextLead.status} from dashboard`, timestamp: new Date().toISOString() }],
    } : lead);
    persist(next);
    if (requiresFollowUp) {
      setToast({ message: 'Status requires follow-up date. Auto-set to +3 days.', tone: 'success' });
    }
  };

  const runImportCsv = async (file: File) => {
    try {
      const text = await file.text();
      const imported = parseLeadsCsv(text);
      if (!imported.length) {
        setToast({ message: 'No valid rows found in CSV import.', tone: 'error' });
        return;
      }
      const merged = appendLeads(imported);
      persist(merged);
      setToast({ message: `Imported ${imported.length} leads from CSV.`, tone: 'success' });
    } catch {
      setToast({ message: 'CSV import failed. Please verify file format.', tone: 'error' });
    }
  };

  const totalLeads = leads.length;
  const highIntent = leads.filter((lead) => lead.leadScore >= 85).length;
  const averageScore = totalLeads ? Math.round(leads.reduce((sum, lead) => sum + lead.leadScore, 0) / totalLeads) : 0;
  const thisMonthContacted = leads.filter((lead) => {
    if (lead.status !== 'Contacted') return false;
    const created = new Date(lead.createdAt);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;
  const goalProgress = Math.min(100, Math.round((thisMonthContacted / Math.max(goal, 1)) * 100));

  const grouped = useMemo(() => {
    return (['New', 'Ready', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'] as LeadStatus[]).map((status) => ({
      status,
      leads: filtered.filter((lead) => lead.status === status),
    }));
  }, [filtered]);

  const batchStats = useMemo(() => {
    return sessions.map((session) => {
      const sessionBatch = leads.filter((lead) => lead.batchId === session.id);
      const won = sessionBatch.filter((lead) => lead.status === 'Won').length;
      const contacted = sessionBatch.filter((lead) => lead.status === 'Contacted').length;
      const avgScore = sessionBatch.length ? Math.round(sessionBatch.reduce((sum, lead) => sum + lead.leadScore, 0) / sessionBatch.length) : 0;
      return { session, won, contacted, avgScore };
    });
  }, [leads, sessions]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 md:px-6">
      <CommandPalette leads={leads} />
      <header className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <SparklineLogo />
          <div>
            <h1 className="text-3xl font-bold tracking-tight"><span className="brand-gradient-text">Sparkline</span></h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">Find better leads. Reach out smarter.</p>
            <p className="mt-1 text-xs text-slate-500">Press ⌘K / Ctrl+K to search instantly.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link className="btn-secondary" href="/activity">Activity</Link>
          <ThemeToggle />
        </div>
      </header>

      <section className="space-y-6">
        {toast && (
          <div className={`rounded-xl px-4 py-3 text-sm ${toast.tone === 'success' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-300' : 'border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-700/40 dark:bg-rose-900/20 dark:text-rose-300'}`}>
            {toast.message}
          </div>
        )}

        <SearchForm hasLastSearch={sessions.length > 0} loading={isLoading} onGenerate={generate} onRerunLast={() => sessions[0] && generate(sessions[0].input)} />

        {duplicateWarning && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300">{duplicateWarning}</div>}

        <div className="grid gap-3 sm:grid-cols-4">
          <div className="card p-4"><p className="text-xs uppercase text-slate-500">Total Leads</p><p className="mt-1 text-2xl font-bold">{totalLeads}</p></div>
          <div className="card p-4"><p className="text-xs uppercase text-slate-500">High Intent (85+)</p><p className="mt-1 text-2xl font-bold">{highIntent}</p></div>
          <div className="card p-4"><p className="text-xs uppercase text-slate-500">Average Score</p><p className="mt-1 text-2xl font-bold">{averageScore || '—'}</p></div>
          <div className="card p-4">
            <p className="text-xs uppercase text-slate-500">Contacted This Month</p>
            <p className="mt-1 text-2xl font-bold">{thisMonthContacted} / {goal}</p>
            <input className="field mt-2" min={1} onChange={(event) => {
              const monthly = Number(event.target.value) || 1;
              setGoal(monthly);
              saveGoal({ monthly });
            }} type="number" value={goal} />
            <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-2 rounded-full bg-brand-500" style={{ width: `${goalProgress}%` }} /></div>
          </div>
        </div>

        <PipelineChart counts={pipelineCounts} />

        <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex w-full max-w-5xl flex-wrap gap-2">
            <input className="field disabled:cursor-not-allowed disabled:opacity-60" disabled={isLoading} onChange={(e) => setQuery(e.target.value)} placeholder="Search by business, contact, city, or status" value={query} />
            <select className="field max-w-[200px]" onChange={(e) => setStatusFilter(e.target.value as (typeof statuses)[number])} value={statusFilter}>
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <select className="field max-w-[160px]" onChange={(e) => setSourceFilter(e.target.value as (typeof sourceOptions)[number])} value={sourceFilter}>
              {sourceOptions.map((source) => <option key={source} value={source}>{source}</option>)}
            </select>
            <input className="field max-w-[130px]" max={99} min={65} onChange={(e) => setMinScore(Math.max(65, Math.min(99, Number(e.target.value) || 65)))} type="number" value={minScore} />
            <button className="btn-secondary" onClick={() => setSortDirection((prev) => prev === 'desc' ? 'asc' : 'desc')}>Sort Score: {sortDirection === 'desc' ? 'High→Low' : 'Low→High'}</button>
            <button className="btn-secondary" onClick={() => { setQuery(''); setStatusFilter('All'); setSourceFilter('All'); setMinScore(65); }}>Clear Filters</button>
            <button className={`btn-secondary ${view === 'table' ? '!border-brand-500 !text-brand-600' : ''}`} onClick={() => setView('table')}>Table</button>
            <button className={`btn-secondary ${view === 'kanban' ? '!border-brand-500 !text-brand-600' : ''}`} onClick={() => setView('kanban')}>Kanban</button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" disabled={!filtered.length || isLoading} onClick={() => exportLeadsCsv(filtered)}>{isLoading ? 'Generating...' : 'Export CSV'}</button>
            <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>Import CSV</button>
            <button className="btn-secondary" onClick={exportBackup}>Export Backup</button>
            <button className="btn-secondary" onClick={() => backupInputRef.current?.click()}>Import Backup</button>
            <button className="btn-secondary" disabled={!leads.length || isLoading} onClick={() => {
              setUndoSnapshot(leads);
              setLeads([]);
              saveLeads([]);
              saveAccounts([]);
              const activityWithoutLeadEvents = loadActivities().filter((item) => !leads.find((lead) => lead.id === item.accountId));
              saveActivities(activityWithoutLeadEvents);
              setToast({ message: 'Leads cleared. You can undo once.', tone: 'success' });
            }}>Clear Leads</button>
            <button className="btn-secondary" disabled={!undoSnapshot} onClick={() => {
              if (!undoSnapshot) return;
              persist(undoSnapshot);
              setUndoSnapshot(null);
              setToast({ message: 'Undo complete. Leads restored.', tone: 'success' });
            }}>Undo Clear</button>
          </div>
        </div>

        <input accept=".csv" className="hidden" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void runImportCsv(file);
          event.currentTarget.value = '';
        }} ref={fileInputRef} type="file" />

        <input accept=".json" className="hidden" onChange={async (event) => {
          const file = event.target.files?.[0];
          if (file) {
            try {
              const text = await file.text();
              importBackup(JSON.parse(text) as { leads?: Lead[]; sessions?: ReturnType<typeof loadSessions> });
              setLeads(loadLeads());
              setSessions(loadSessions());
              setToast({ message: 'Backup imported successfully.', tone: 'success' });
            } catch {
              setToast({ message: 'Backup import failed. Invalid JSON structure.', tone: 'error' });
            }
          }
          event.currentTarget.value = '';
        }} ref={backupInputRef} type="file" />

        {view === 'table' ? (
          <LeadsTable
            leads={filtered}
            loading={isLoading}
            onBulkDelete={(ids) => persist(leads.filter((lead) => !ids.includes(lead.id)))}
            onBulkExport={(ids) => exportLeadsCsv(leads.filter((lead) => ids.includes(lead.id)))}
            onBulkUpdate={(ids, status) => persist(leads.map((lead) => ids.includes(lead.id) ? { ...lead, status } : lead))}
            onUpdateLead={updateLead}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {grouped.map((lane) => (
              <div key={lane.status} className="card p-3">
                <h3 className="mb-2 text-sm font-semibold">{lane.status} ({lane.leads.length})</h3>
                <div className="space-y-2">
                  {lane.leads.map((lead) => (
                    <Link key={lead.id} className="block rounded-lg border border-slate-200 p-3 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800" href={`/leads/${lead.id}`}>
                      <p className="font-medium">{lead.businessName}</p>
                      <p className="text-xs text-slate-500">{lead.contactName} · Score {lead.leadScore}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="card p-4">
          <h3 className="text-sm font-semibold">Session History</h3>
          <ul className="mt-2 space-y-2 text-xs">
            {batchStats.map(({ session, won, contacted, avgScore }) => (
              <li key={session.id} className="rounded border border-slate-200 p-2 dark:border-slate-700">
                <p>{session.input.niche} in {session.input.city}, {session.input.state}</p>
                <p className="text-slate-500">Won: {won} | Contacted: {contacted} | Avg Score: {avgScore || '—'}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

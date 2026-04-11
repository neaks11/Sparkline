'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Lead, LeadStatus } from '@/lib/types';

interface LeadsTableProps {
  leads: Lead[];
  loading?: boolean;
  onUpdateLead: (lead: Lead) => void;
  onBulkUpdate: (ids: string[], status: LeadStatus) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkExport: (ids: string[]) => void;
}

const statusOptions: LeadStatus[] = [
  // SMB
  'New', 'Ready', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost',
  // Senior Living / Referral
  'Relationship Building', 'Partner Qualified', 'Partner Established', 'Active Referrals', 'Dormant',
];
const sourceOptions: Lead['source'][] = ['Generated', 'Manual', 'CSV Import', 'LinkedIn', 'Referral'];
const defaultColumns = ['Business Name', 'Contact', 'City', 'Lead Score', 'Type', 'Follow-up', 'Source', 'Status', 'Actions'];

function isStale(lead: Lead): boolean {
  if (lead.status === 'Won' || lead.status === 'Lost') return false;
  const last = lead.activity.at(-1);
  if (!last) return false;
  const diff = Date.now() - new Date(last.timestamp).getTime();
  return diff > 14 * 24 * 60 * 60 * 1000;
}

function isDueTodayOrOverdue(lead: Lead): boolean {
  if (!lead.followUpDate) return false;
  const target = new Date(lead.followUpDate);
  const today = new Date();
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return targetDay <= todayDay;
}

export function LeadsTable({ leads, loading = false, onUpdateLead, onBulkDelete, onBulkExport, onBulkUpdate }: LeadsTableProps) {
  const [copyStatus, setCopyStatus] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<LeadStatus>('Contacted');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns);

  useEffect(() => {
    const saved = localStorage.getItem('sparkline_columns');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as string[];
        if (parsed.length) setVisibleColumns(parsed);
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [leads]);

  const totalPages = Math.max(1, Math.ceil(leads.length / pageSize));
  const pagedLeads = useMemo(() => leads.slice((page - 1) * pageSize, page * pageSize), [leads, page]);

  const toggleSelected = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleColumn = (column: string) => {
    const next = visibleColumns.includes(column) ? visibleColumns.filter((item) => item !== column) : [...visibleColumns, column];
    setVisibleColumns(next);
    localStorage.setItem('sparkline_columns', JSON.stringify(next));
  };

  const statusClass = (status: LeadStatus): string => {
    if (status === 'Won') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
    if (status === 'Lost') return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300';
    if (status === 'Qualified' || status === 'Partner Qualified') return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300';
    if (status === 'Proposal Sent' || status === 'Partner Established') return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300';
    if (status === 'Contacted' || status === 'Relationship Building') return 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300';
    if (status === 'Active Referrals') return 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300';
    if (status === 'Dormant') return 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400';
    if (status === 'Ready') return 'bg-brand-100 text-brand-900 dark:bg-brand-500/20 dark:text-brand-100';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
  };

  const leadTypeLabel = (lead: Lead): string => {
    if (!lead.leadType || lead.leadType === 'Standard') return '';
    const icons: Record<string, string> = {
      'Medical Facility': '🏥',
      'Professional Influencer': '⚖️',
      'Referral Partner': '🤝',
      'Community Organization': '⛪',
      'Senior Living Community': '🏡',
      'Family Decision Support': '👨‍👩‍👧',
    };
    return `${icons[lead.leadType] ?? '•'} ${lead.leadType}`;
  };

  const copyEmail = async (email: string, businessName: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopyStatus(`Copied email for ${businessName}`);
    } catch {
      setCopyStatus(`Unable to copy email for ${businessName}`);
    } finally {
      window.setTimeout(() => setCopyStatus(''), 1800);
    }
  };

  if (loading) {
    return (
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-100 text-left dark:bg-slate-800">
              <tr>{['Business Name', 'Contact', 'City', 'Lead Score', 'Status', 'Actions'].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="border-t border-slate-200 dark:border-slate-800">
                  {Array.from({ length: 6 }).map((__, cellIndex) => <td key={cellIndex} className="px-4 py-3"><div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" /></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return <div className="card p-10 text-center text-slate-500">No leads yet. Run a niche + location search to generate your first batch.</div>;
  }

  return (
    <>
      <div className="card p-4">
        <details>
          <summary className="cursor-pointer text-sm font-medium">Show / Hide Columns</summary>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            {defaultColumns.map((column) => (
              <label key={column} className="flex items-center gap-1">
                <input checked={visibleColumns.includes(column)} onChange={() => toggleColumn(column)} type="checkbox" />
                {column}
              </label>
            ))}
          </div>
        </details>
      </div>

      {/* mobile cards */}
      <div className="space-y-3 md:hidden">
        {pagedLeads.map((lead) => (
          <div key={lead.id} className={`card p-4 ${isDueTodayOrOverdue(lead) ? 'border-l-4 border-l-yellow-400' : ''}`}>
            <p className="font-semibold">{lead.businessName} {isStale(lead) ? '⏱' : ''}</p>
            <p className="text-xs text-slate-500">{lead.contactName} · {lead.city}, {lead.state}</p>
            <p className="mt-2 text-sm">Score {lead.leadScore} · {lead.status}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link className="btn-secondary" href={`/leads/${lead.id}`}>View</Link>
              <button className="btn-secondary" onClick={() => copyEmail(lead.email, lead.businessName)}>Copy Email</button>
            </div>
          </div>
        ))}
      </div>

      <div className="card hidden overflow-hidden md:block">
        {copyStatus && <p className="px-4 pt-3 text-xs text-emerald-600 dark:text-emerald-300">{copyStatus}</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-100 text-left dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3"><input aria-label="Select all" checked={pagedLeads.every((lead) => selectedIds.has(lead.id))} onChange={(e) => {
                  const next = new Set(selectedIds);
                  pagedLeads.forEach((lead) => {
                    if (e.target.checked) next.add(lead.id);
                    else next.delete(lead.id);
                  });
                  setSelectedIds(next);
                }} type="checkbox" /></th>
                {defaultColumns.filter((column) => visibleColumns.includes(column)).map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {pagedLeads.map((lead) => (
                <tr key={lead.id} className={`border-t border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/70 ${isDueTodayOrOverdue(lead) ? 'border-l-4 border-l-yellow-400' : ''}`}>
                  <td className="px-4 py-3"><input checked={selectedIds.has(lead.id)} onChange={() => toggleSelected(lead.id)} type="checkbox" /></td>
                  {visibleColumns.includes('Business Name') && <td className="px-4 py-3 font-medium">{lead.businessName} {isStale(lead) ? '⏱' : ''}</td>}
                  {visibleColumns.includes('Contact') && <td className="px-4 py-3">{lead.contactName}</td>}
                  {visibleColumns.includes('City') && <td className="px-4 py-3">{lead.city}, {lead.state}</td>}
                  {visibleColumns.includes('Lead Score') && (
                    <td className="px-4 py-3">
                      <details className="inline-block">
                        <summary className={`cursor-pointer rounded-full px-2 py-1 text-xs font-semibold ${lead.leadScore > 85 ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' : 'bg-brand-100 text-brand-900 dark:bg-brand-500/20 dark:text-brand-100'}`}>
                          {lead.leadScore} {lead.leadScore > 85 ? '🔥' : ''}
                        </summary>
                        <ul className="mt-1 rounded border border-slate-200 bg-white p-2 text-xs shadow dark:border-slate-700 dark:bg-slate-900">
                          {(lead.scoreFactors ?? ['No factors yet']).map((factor) => <li key={factor}>• {factor}</li>)}
                        </ul>
                      </details>
                    </td>
                  )}
                  {visibleColumns.includes('Type') && (
                    <td className="px-4 py-3 text-xs">
                      {leadTypeLabel(lead) || <span className="text-slate-400">—</span>}
                      {lead.referralInfluenceScore ? (
                        <p className="mt-0.5 text-slate-400">Influence: {lead.referralInfluenceScore}</p>
                      ) : null}
                    </td>
                  )}
                  {visibleColumns.includes('Follow-up') && <td className="px-4 py-3">{lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString() : '—'}</td>}
                  {visibleColumns.includes('Source') && (
                    <td className="px-4 py-3">
                      <select className="rounded-lg px-2 py-1 text-xs" onChange={(event) => onUpdateLead({ ...lead, source: event.target.value as Lead['source'] })} value={lead.source}>
                        {sourceOptions.map((source) => <option key={source} value={source}>{source}</option>)}
                      </select>
                    </td>
                  )}
                  {visibleColumns.includes('Status') && (
                    <td className="px-4 py-3">
                      <select aria-label={`Status for ${lead.businessName}`} className={`rounded-lg px-2 py-1 text-xs font-semibold ${statusClass(lead.status)}`} onChange={(event) => onUpdateLead({ ...lead, status: event.target.value as LeadStatus })} value={lead.status}>
                        {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </td>
                  )}
                  {visibleColumns.includes('Actions') && (
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link className="btn-secondary" href={`/leads/${lead.id}`}>View</Link>
                        <a className="btn-secondary" href={`mailto:${lead.email}`}>Email</a>
                        <a className="btn-secondary" href={`tel:${lead.phone}`}>Call</a>
                        <button className="btn-secondary" onClick={() => copyEmail(lead.email, lead.businessName)}>Copy Email</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card flex items-center justify-between p-3 text-sm">
        <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>Previous</button>
        <p>Page {page} of {totalPages}</p>
        <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>Next</button>
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 w-[95%] max-w-4xl -translate-x-1/2 rounded-2xl border border-slate-300 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">{selectedIds.size} selected</p>
            <div className="flex flex-wrap gap-2">
              <select className="field max-w-[200px]" onChange={(event) => setBulkStatus(event.target.value as LeadStatus)} value={bulkStatus}>
                <optgroup label="SMB Pipeline">
                  {(['New','Ready','Contacted','Qualified','Proposal Sent','Won','Lost'] as LeadStatus[]).map((s) => <option key={s} value={s}>{s}</option>)}
                </optgroup>
                <optgroup label="Senior Living / Referral">
                  {(['Relationship Building','Partner Qualified','Partner Established','Active Referrals','Dormant'] as LeadStatus[]).map((s) => <option key={s} value={s}>{s}</option>)}
                </optgroup>
              </select>
              <button className="btn-secondary" onClick={() => onBulkUpdate(Array.from(selectedIds), bulkStatus)}>Bulk Update Status</button>
              <button className="btn-secondary" onClick={() => onBulkExport(Array.from(selectedIds))}>Bulk Export CSV</button>
              <button className="btn-primary" onClick={() => {
                onBulkDelete(Array.from(selectedIds));
                setSelectedIds(new Set());
              }}>Bulk Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Lead, LeadStatus } from '@/lib/types';

interface LeadsTableProps {
  leads: Lead[];
  loading?: boolean;
  onUpdateLead: (lead: Lead) => void;
}

const statusOptions: LeadStatus[] = ['New', 'Ready', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];

export function LeadsTable({ leads, loading = false, onUpdateLead }: LeadsTableProps) {
  const [copyStatus, setCopyStatus] = useState('');

  const statusClass = (status: LeadStatus): string => {
    if (status === 'Won') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
    if (status === 'Lost') return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300';
    if (status === 'Qualified') return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300';
    if (status === 'Proposal Sent') return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300';
    if (status === 'Contacted') return 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300';
    if (status === 'Ready') return 'bg-brand-100 text-brand-900 dark:bg-brand-500/20 dark:text-brand-100';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
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
              <tr>
                {['Business Name', 'Contact', 'City', 'Lead Score', 'Status', 'Actions'].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="border-t border-slate-200 dark:border-slate-800">
                  {Array.from({ length: 6 }).map((__, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3">
                      <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="card p-10 text-center text-slate-500">
        No leads yet. Run a niche + location search to generate your first batch.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {copyStatus && <p className="px-4 pt-3 text-xs text-emerald-600 dark:text-emerald-300">{copyStatus}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-100 text-left dark:bg-slate-800">
            <tr>
              {['Business Name', 'Contact', 'City', 'Lead Score', 'Status', 'Actions'].map((heading) => (
                <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/70">
                <td className="px-4 py-3 font-medium">{lead.businessName}</td>
                <td className="px-4 py-3">{lead.contactName}</td>
                <td className="px-4 py-3">{lead.city}, {lead.state}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${lead.leadScore > 85 ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' : 'bg-brand-100 text-brand-900 dark:bg-brand-500/20 dark:text-brand-100'}`}>
                    {lead.leadScore} {lead.leadScore > 85 ? '🔥' : ''}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    aria-label={`Status for ${lead.businessName}`}
                    className={`rounded-lg px-2 py-1 text-xs font-semibold ${statusClass(lead.status)}`}
                    onChange={(event) => onUpdateLead({ ...lead, status: event.target.value as LeadStatus })}
                    value={lead.status}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link className="btn-secondary" href={`/leads/${lead.id}`}>View</Link>
                    <a className="btn-secondary" href={`mailto:${lead.email}`}>Email</a>
                    <a className="btn-secondary" href={`tel:${lead.phone}`}>Call</a>
                    <button className="btn-secondary" onClick={() => copyEmail(lead.email, lead.businessName)}>Copy Email</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

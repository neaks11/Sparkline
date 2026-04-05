'use client';

import Link from 'next/link';
import { Lead } from '@/lib/types';

interface LeadsTableProps {
  leads: Lead[];
}

export function LeadsTable({ leads }: LeadsTableProps) {
  if (leads.length === 0) {
    return (
      <div className="card p-10 text-center text-slate-500">
        No leads yet. Run a niche + location search to generate your first batch.
      </div>
    );
  }

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
                <td className="px-4 py-3">{lead.status}</td>
                <td className="px-4 py-3">
                  <Link className="btn-secondary" href={`/leads/${lead.id}`}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

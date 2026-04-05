'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { OutreachEditor } from '@/components/outreach-editor';
import { exportLeadOutreach } from '@/lib/export';
import { buildOutreach } from '@/lib/outreach-generator';
import { loadLeadById, loadLeads, saveLeads } from '@/lib/storage';
import { Lead } from '@/lib/types';

function updateInStorage(updated: Lead): void {
  const all = loadLeads().map((lead) => lead.id === updated.id ? updated : lead);
  saveLeads(all);
}

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);

  useEffect(() => {
    const found = loadLeadById(params.id);
    setLead(found);
  }, [params.id]);

  if (!lead) {
    return (
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-8">
        <Link href="/" className="btn-secondary">← Back</Link>
        <div className="card mt-6 p-10 text-center text-slate-500">Lead not found. Generate leads from the dashboard first.</div>
      </main>
    );
  }

  const updateLead = (updated: Lead) => {
    setLead(updated);
    updateInStorage(updated);
  };

  const regenerate = () => {
    const next = {
      ...lead,
      outreach: buildOutreach(lead, lead.notes),
      activity: [...lead.activity, { id: crypto.randomUUID(), label: 'Outreach regenerated', timestamp: new Date().toISOString() }],
    };
    updateLead(next);
  };

  const markContacted = () => {
    const next = {
      ...lead,
      status: 'Contacted' as const,
      activity: [...lead.activity, { id: crypto.randomUUID(), label: 'Marked as contacted', timestamp: new Date().toISOString() }],
    };
    updateLead(next);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl space-y-6 px-4 py-8 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="btn-secondary">← Back to Dashboard</Link>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => exportLeadOutreach(lead, 'txt')}>Export TXT</button>
          <button className="btn-secondary" onClick={() => exportLeadOutreach(lead, 'json')}>Export JSON</button>
          <button className="btn-primary" onClick={markContacted}>Mark Contacted</button>
        </div>
      </div>

      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{lead.businessName}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">{lead.contactName} · {lead.contactTitle}</p>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-900 dark:bg-brand-500/20 dark:text-brand-50">Score {lead.leadScore}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{lead.status}</span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">Best first touch: {lead.outreach.bestFirstTouch}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-2 text-sm">
            <p><strong>Email:</strong> {lead.email}</p>
            <p><strong>Phone:</strong> {lead.phone}</p>
            <p><strong>Website:</strong> <a className="text-brand-600" href={lead.website} target="_blank" rel="noreferrer">{lead.website}</a></p>
            <p><strong>LinkedIn:</strong> <a className="text-brand-600" href={lead.linkedinUrl} target="_blank" rel="noreferrer">Profile</a></p>
          </div>
          <div className="space-y-2 text-sm">
            <p><strong>Location:</strong> {lead.city}, {lead.state}</p>
            <p><strong>Niche:</strong> {lead.niche}</p>
            <p><strong>Personalization Hook:</strong> {lead.personalizationHook}</p>
          </div>
        </div>

        <div className="mt-5">
          <h2 className="font-semibold">Business Summary</h2>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{lead.summary}</p>
        </div>

        <div className="mt-5">
          <h2 className="font-semibold">Pain Points</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
            {lead.painPoints.map((pain) => <li key={pain}>{pain}</li>)}
          </ul>
        </div>

        <div className="mt-5">
          <h2 className="font-semibold">Notes</h2>
          <textarea className="field mt-2 min-h-24" value={lead.notes} onChange={(e) => updateLead({ ...lead, notes: e.target.value })} />
        </div>

        <div className="mt-5">
          <h2 className="font-semibold">Activity Timeline</h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
            {lead.activity.slice().reverse().map((item) => <li key={item.id}>• {new Date(item.timestamp).toLocaleString()}: {item.label}</li>)}
          </ul>
        </div>
      </section>

      <OutreachEditor lead={lead} onUpdate={updateLead} onRegenerate={regenerate} />
    </main>
  );
}

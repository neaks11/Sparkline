'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { OutreachEditor } from '@/components/outreach-editor';
import { SparklineLogo } from '@/components/sparkline-logo';
import { exportLeadOutreach } from '@/lib/export';
import { GhlPushButton } from '@/components/ghl-push-button';
import { buildNurtureSequence } from '@/lib/nurture-sequence';
import { buildOutreach } from '@/lib/outreach-generator';
import { loadLeadById, loadLeads, saveLeads } from '@/lib/storage';
import { Lead, LeadStatus } from '@/lib/types';

const statusOptions: LeadStatus[] = ['New', 'Ready', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];

function updateInStorage(updated: Lead): void {
  const all = loadLeads().map((lead) => lead.id === updated.id ? updated : lead);
  saveLeads(all);
}

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');

  useEffect(() => {
    const found = loadLeadById(params.id);
    setLead(found);
    setNotesDraft(found?.notes ?? '');
    setIsHydrated(true);
  }, [params.id]);

  useEffect(() => {
    if (!lead) return;
    const timeout = window.setTimeout(() => {
      if (notesDraft.trim() !== lead.notes.trim()) {
        updateLead({ ...lead, notes: notesDraft });
      }
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [lead, notesDraft]);

  if (!isHydrated) {
    return (
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-8">
        <div className="card mt-6 p-10 text-center text-slate-500">Loading lead details...</div>
      </main>
    );
  }

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
    if (lead.status === 'Contacted') return;

    const next = {
      ...lead,
      status: 'Contacted' as const,
      activity: [...lead.activity, { id: crypto.randomUUID(), label: 'Marked as contacted', timestamp: new Date().toISOString() }],
    };
    updateLead(next);
  };

  const updateStatus = (nextStatus: LeadStatus) => {
    if (nextStatus === lead.status) return;
    updateLead({
      ...lead,
      status: nextStatus,
      activity: [...lead.activity, { id: crypto.randomUUID(), label: `Status updated to ${nextStatus}`, timestamp: new Date().toISOString() }],
    });
  };

  const sequence = buildNurtureSequence(lead);
  const completed = new Set(lead.activity.filter((item) => item.label.startsWith('Nurture:')).map((item) => item.label.replace('Nurture: ', '')));

  const logNurtureStep = (stepId: string, channel: string) => {
    updateLead({
      ...lead,
      activity: [
        ...lead.activity,
        { id: crypto.randomUUID(), label: `Nurture: ${stepId}`, timestamp: new Date().toISOString() },
        { id: crypto.randomUUID(), label: `Follow-up sent via ${channel}`, timestamp: new Date().toISOString() },
      ],
    });
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl space-y-6 px-4 py-8 md:px-6">
      <header className="flex items-center gap-3">
        <SparklineLogo size={32} />
        <p className="text-2xl font-bold tracking-tight">
          <span className="brand-gradient-text">Sparkline</span>
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="btn-secondary">← Back to Dashboard</Link>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => exportLeadOutreach(lead, 'txt')}>Export TXT</button>
          <button className="btn-secondary" onClick={() => exportLeadOutreach(lead, 'json')}>Export JSON</button>
          <button className="btn-secondary print:hidden" onClick={() => window.print()}>Print</button>
          <GhlPushButton lead={lead} onPushed={(id) => updateLead({ ...lead, notes: lead.notes + `
GHL Contact ID: ${id}` })} />
          <button className="btn-primary disabled:cursor-not-allowed disabled:opacity-60" disabled={lead.status === 'Contacted'} onClick={markContacted}>
            {lead.status === 'Contacted' ? 'Already Contacted' : 'Mark Contacted'}
          </button>
        </div>
      </div>

      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{lead.businessName}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">{lead.contactName} · {lead.contactTitle}</p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${lead.leadScore >= 90 ? 'bg-emerald-500' : lead.leadScore >= 80 ? 'bg-brand-500' : lead.leadScore >= 70 ? 'bg-amber-500' : 'bg-slate-400'}`}>
                {lead.leadScore}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Lead Score</p>
                <div className="mt-0.5 flex h-1.5 w-24 rounded-full bg-slate-200 dark:bg-slate-700">
                  <div className={`h-1.5 rounded-full ${lead.leadScore >= 90 ? 'bg-emerald-500' : lead.leadScore >= 80 ? 'bg-brand-500' : 'bg-amber-500'}`} style={{ width: `${lead.leadScore}%` }} />
                </div>
              </div>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{lead.status}</span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">Best first touch: {lead.outreach.bestFirstTouch}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <strong>Email:</strong>
              <span>{lead.email || <span className="text-slate-400 italic">not available</span>}</span>
              {lead.email && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${/^[^@]+@[^@]+\.[^@]+$/.test(lead.email) ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300'}`}>
                  {/^[^@]+@[^@]+\.[^@]+$/.test(lead.email) ? '✓ Valid format' : '⚠ Check email'}
                </span>
              )}
            </div>
            <p><strong>Phone:</strong> {lead.phone}</p>
            <p><strong>Website:</strong> <a className="text-brand-600" href={lead.website} target="_blank" rel="noreferrer">{lead.website}</a></p>
            <p><strong>LinkedIn:</strong> <a className="text-brand-600" href={lead.linkedinUrl} target="_blank" rel="noreferrer">Profile</a></p>
            <div className="flex flex-wrap gap-2 pt-2">
              <a className="btn-secondary" href={`mailto:${lead.email}`}>Email Contact</a>
              <a className="btn-secondary" href={`tel:${lead.phone}`}>Call Contact</a>
              <a className="btn-secondary" href={lead.website} rel="noreferrer" target="_blank">Visit Website</a>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <p><strong>Location:</strong> {lead.city}, {lead.state}</p>
            <p><strong>Niche:</strong> {lead.niche}</p>
            <p><strong>Personalization Hook:</strong> {lead.personalizationHook}</p>
            <div className="pt-2">
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Source</label>
              <select className="field" onChange={(event) => updateLead({ ...lead, source: event.target.value as Lead['source'] })} value={lead.source}>
                {(['Generated', 'Apollo', 'Manual', 'CSV Import', 'LinkedIn', 'Referral'] as Lead['source'][]).map((source) => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>
            <div className="pt-2">
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Follow-up Date</label>
              <input className="field" onChange={(event) => updateLead({ ...lead, followUpDate: event.target.value || null })} type="date" value={lead.followUpDate ?? ''} />
            </div>
            <div className="pt-2">
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Pipeline Stage</label>
              <select className="field" onChange={(event) => updateStatus(event.target.value as LeadStatus)} value={lead.status}>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
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

        {lead.scoreFactors && lead.scoreFactors.length > 0 && (
          <div className="mt-5">
            <h2 className="font-semibold">Score Breakdown</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {lead.scoreFactors.map((factor) => (
                <span key={factor} className="rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:border-brand-700/30 dark:bg-brand-900/20 dark:text-brand-300">
                  + {factor}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5">
          <h2 className="font-semibold">Notes</h2>
          <textarea
            className="field mt-2 min-h-[96px] resize-y"
            value={notesDraft}
            onChange={(event) => setNotesDraft(event.target.value)}
            placeholder="Add notes about this lead, conversation history, next steps..."
          />
        </div>

        <div className="mt-5">
          <h2 className="font-semibold">Activity Timeline</h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
            {lead.activity.slice().reverse().map((item) => <li key={item.id}>• {new Date(item.timestamp).toLocaleString()}: {item.label}</li>)}
          </ul>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">2-Week Nurture Sequence (Recommended)</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Designed for multi-touch follow-up across email, call, and LinkedIn with clear objective progression.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-slate-100 text-left dark:bg-slate-800">
              <tr>
                {['Day', 'Phase', 'Channel', 'Format', 'Objective', 'Suggested Messaging', 'Action'].map((heading) => (
                  <th key={heading} className="px-3 py-2 font-semibold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sequence.map((step) => {
                const isDone = completed.has(step.id);
                return (
                  <tr key={step.id} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-3 py-2">Day {step.day}</td>
                    <td className="px-3 py-2">{step.phase}</td>
                    <td className="px-3 py-2">{step.channel}</td>
                    <td className="px-3 py-2">{step.format}</td>
                    <td className="px-3 py-2">{step.objective}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{step.message}</td>
                    <td className="px-3 py-2">
                      <button className="btn-secondary" disabled={isDone} onClick={() => logNurtureStep(step.id, step.channel)}>
                        {isDone ? 'Logged' : 'Log Activity'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <OutreachEditor lead={lead} onUpdate={updateLead} onRegenerate={regenerate} />
    </main>
  );
}

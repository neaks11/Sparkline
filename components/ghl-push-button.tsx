'use client';

import { useState } from 'react';
import { toast } from '@/components/toast';
import { Lead } from '@/lib/types';

interface GhlPushButtonProps {
  lead: Lead;
  onPushed?: (contactId: string) => void;
}

type PushState = 'idle' | 'loading' | 'success' | 'error' | 'unconfigured';

function parseName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export function GhlPushButton({ lead, onPushed }: GhlPushButtonProps) {
  const [state, setState] = useState<PushState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const push = async () => {
    setState('loading');
    setErrorMsg('');

    const { firstName, lastName } = parseName(lead.contactName);

    try {
      const res = await fetch('/api/ghl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email: lead.email,
          phone: lead.phone,
          companyName: lead.businessName,
          website: lead.website,
          city: lead.city,
          state: lead.state,
          source: 'Sparkline',
          tags: ['sparkline-lead', lead.niche.toLowerCase().replace(/\s+/g, '-'), lead.status.toLowerCase()],
          customField: {
            sparkline_lead_score: String(lead.leadScore),
            sparkline_niche: lead.niche,
            sparkline_summary: lead.summary,
          },
        }),
      });

      if (res.status === 501) {
        setState('unconfigured');
        return;
      }

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setErrorMsg(data.error ?? 'Unknown error');
        toast.error('GHL push failed: ' + (data.error ?? 'Unknown error'));
        setState('error');
        return;
      }

      const data = await res.json() as { contact?: { id?: string } };
      setState('success');
      toast.success('Lead pushed to GoHighLevel!');
      if (onPushed && data.contact?.id) onPushed(data.contact.id);
      setTimeout(() => setState('idle'), 4000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Network error');
      setState('error');
    }
  };

  if (state === 'unconfigured') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300">
        Add <code>GHL_API_KEY</code> and <code>GHL_LOCATION_ID</code> to{' '}
        <code>~/Sparkline/.env.local</code> to enable GHL push.
      </div>
    );
  }

  if (state === 'success') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-300">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Pushed to GoHighLevel
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        className="btn-secondary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={state === 'loading'}
        onClick={push}
        title="Push this lead to your GoHighLevel CRM as a new contact"
      >
        {state === 'loading' ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Pushing...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Push to GHL
          </>
        )}
      </button>
      {state === 'error' && (
        <p className="text-xs text-red-500">{errorMsg}</p>
      )}
    </div>
  );
}

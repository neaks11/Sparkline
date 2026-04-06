'use client';

import { useState } from 'react';
import { Lead } from '@/lib/types';

interface OutreachEditorProps {
  lead: Lead;
  onUpdate: (lead: Lead) => void;
  onRegenerate: () => void;
}

type Tab = 'email' | 'voicemail' | 'linkedin';

export function OutreachEditor({ lead, onUpdate, onRegenerate }: OutreachEditorProps) {
  const [tab, setTab] = useState<Tab>('email');
  const [copyStatus, setCopyStatus] = useState<string>('');

  const showStatus = (message: string) => {
    setCopyStatus(message);
    window.setTimeout(() => setCopyStatus(''), 1800);
  };

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showStatus(`${label} copied`);
    } catch {
      showStatus(`Unable to copy ${label.toLowerCase()}`);
    }
  };

  const copyAll = async () => {
    await copy(
      `EMAIL SUBJECT\n${lead.outreach.emailSubject}\n\nEMAIL BODY\n${lead.outreach.emailBody}\n\nVOICEMAIL SCRIPT\n${lead.outreach.voicemailScript}\n\nLINKEDIN MESSAGE\n${lead.outreach.linkedinMessage}`,
      'Full outreach bundle',
    );
  };

  return (
    <div className="card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          {(['email', 'voicemail', 'linkedin'] as Tab[]).map((value) => (
            <button key={value} onClick={() => setTab(value)} className={`btn-secondary ${tab === value ? '!border-brand-500 !text-brand-600' : ''}`}>{value === 'linkedin' ? 'LinkedIn Message' : value === 'voicemail' ? 'Voicemail Drop' : 'Email'}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={copyAll}>Copy All</button>
          <button className="btn-primary" onClick={onRegenerate}>Regenerate</button>
        </div>
      </div>
      {copyStatus && <p className="mb-3 text-xs text-emerald-600 dark:text-emerald-300">{copyStatus}</p>}

      {tab === 'email' && (
        <div className="space-y-3">
          <input className="field" value={lead.outreach.emailSubject} onChange={(e) => onUpdate({ ...lead, outreach: { ...lead.outreach, emailSubject: e.target.value } })} />
          <textarea className="field min-h-48" value={lead.outreach.emailBody} onChange={(e) => onUpdate({ ...lead, outreach: { ...lead.outreach, emailBody: e.target.value } })} />
          <button className="btn-secondary" onClick={() => copy(`${lead.outreach.emailSubject}\n${lead.outreach.emailBody}`, 'Email')}>Copy Email</button>
        </div>
      )}

      {tab === 'voicemail' && (
        <div className="space-y-3">
          <textarea className="field min-h-40" value={lead.outreach.voicemailScript} onChange={(e) => onUpdate({ ...lead, outreach: { ...lead.outreach, voicemailScript: e.target.value } })} />
          <button className="btn-secondary" onClick={() => copy(lead.outreach.voicemailScript, 'Voicemail')}>Copy Voicemail</button>
        </div>
      )}

      {tab === 'linkedin' && (
        <div className="space-y-3">
          <textarea className="field min-h-32" maxLength={300} value={lead.outreach.linkedinMessage} onChange={(e) => onUpdate({ ...lead, outreach: { ...lead.outreach, linkedinMessage: e.target.value } })} />
          <p className="text-xs text-slate-500">{lead.outreach.linkedinMessage.length}/300</p>
          <button className="btn-secondary" onClick={() => copy(lead.outreach.linkedinMessage, 'LinkedIn message')}>Copy LinkedIn</button>
        </div>
      )}
    </div>
  );
}

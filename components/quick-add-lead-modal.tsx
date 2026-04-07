'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { buildOutreach } from '@/lib/outreach-generator';
import { toast } from '@/components/toast';
import { Lead, LeadStatus } from '@/lib/types';

interface QuickAddLeadModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (lead: Lead) => void;
}

const BLANK = {
  businessName: '',
  contactName: '',
  contactTitle: '',
  email: '',
  phone: '',
  website: '',
  city: '',
  state: '',
  niche: '',
  notes: '',
  status: 'New' as LeadStatus,
  leadScore: 75,
};

export function QuickAddLeadModal({ open, onClose, onAdd }: QuickAddLeadModalProps) {
  const [form, setForm] = useState(BLANK);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setForm(BLANK);
      setTimeout(() => firstRef.current?.focus(), 80);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const set = <K extends keyof typeof BLANK>(key: K, value: (typeof BLANK)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.businessName.trim() || !form.contactName.trim()) return;

    const now = new Date().toISOString();
    const batchId = `manual-${Date.now()}`;
    const id = crypto.randomUUID();

    const lead: Lead = {
      id,
      apolloId: null,
      batchId,
      createdAt: now,
      businessName: form.businessName.trim(),
      contactName: form.contactName.trim(),
      contactTitle: form.contactTitle.trim() || 'Owner',
      email: form.email.trim(),
      phone: form.phone.trim(),
      website: form.website.trim(),
      linkedinUrl: '',
      niche: form.niche.trim() || 'General',
      city: form.city.trim(),
      state: form.state.trim().toUpperCase().slice(0, 2),
      summary: `${form.businessName} is a business contact added manually.`,
      painPoints: ['Manually added — review and update pain points'],
      personalizationHook: 'Manually added lead',
      leadScore: Math.min(99, Math.max(50, form.leadScore)),
      scoreFactors: ['Manual entry'],
      status: form.status,
      source: 'Manual',
      followUpDate: null,
      notes: form.notes.trim(),
      outreach: { emailSubject: '', emailBody: '', voicemailScript: '', linkedinMessage: '', bestFirstTouch: 'Email' },
      activity: [{ id: crypto.randomUUID(), label: 'Lead added manually', timestamp: now }],
    };

    // Generate outreach if we have enough context
    if (form.niche && form.businessName) {
      lead.outreach = buildOutreach(lead, form.notes || `Reaching out to ${form.businessName}`);
    }

    onAdd(lead);
    toast.success(`${form.businessName} added to your leads!`);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">Add Lead Manually</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none">×</button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Business Name *</label>
              <input
                ref={firstRef}
                className="field"
                placeholder="Apex HVAC Solutions"
                value={form.businessName}
                onChange={(e) => set('businessName', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Contact Name *</label>
              <input
                className="field"
                placeholder="Jordan Smith"
                value={form.contactName}
                onChange={(e) => set('contactName', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Title</label>
              <input
                className="field"
                placeholder="Owner"
                value={form.contactTitle}
                onChange={(e) => set('contactTitle', e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                className="field"
                type="email"
                placeholder="jordan@apexhvac.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Phone</label>
              <input
                className="field"
                placeholder="(555) 123-4567"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Website</label>
              <input
                className="field"
                placeholder="https://www.apexhvac.com"
                value={form.website}
                onChange={(e) => set('website', e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">City</label>
              <input
                className="field"
                placeholder="Chicago"
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">State</label>
              <input
                className="field"
                placeholder="IL"
                maxLength={2}
                value={form.state}
                onChange={(e) => set('state', e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Niche / Industry</label>
              <input
                className="field"
                placeholder="HVAC"
                value={form.niche}
                onChange={(e) => set('niche', e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Lead Score (50–99)</label>
              <input
                className="field"
                type="number"
                min={50}
                max={99}
                value={form.leadScore}
                onChange={(e) => set('leadScore', Math.min(99, Math.max(50, Number(e.target.value))))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Pipeline Stage</label>
              <select
                className="field"
                value={form.status}
                onChange={(e) => set('status', e.target.value as LeadStatus)}
              >
                {(['New', 'Ready', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'] as LeadStatus[]).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <textarea
                className="field min-h-[72px] resize-y"
                placeholder="How you found them, what they need, next steps..."
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!form.businessName.trim() || !form.contactName.trim()}
            >
              Add Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

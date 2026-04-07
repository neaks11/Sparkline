import { Lead, LeadStatus } from '@/lib/types';

export interface NurtureStep {
  id: string;
  day: number;
  phase: LeadStatus;
  channel: 'Email' | 'Call' | 'LinkedIn' | 'SMS';
  format: string;
  objective: string;
  message: string;
}

const defaultSequence: NurtureStep[] = [
  {
    id: 'd0-email-intro',
    day: 0,
    phase: 'New',
    channel: 'Email',
    format: 'Personalized intro email',
    objective: 'Earn initial reply',
    message: 'Hi {{contact}}, quick idea for {{business}} based on {{painPoint}}. Open to a 10-minute teardown this week?',
  },
  {
    id: 'd2-linkedin-connect',
    day: 2,
    phase: 'New',
    channel: 'LinkedIn',
    format: 'Connection + short DM',
    objective: 'Create second touchpoint',
    message: 'Sent a short note here in case email buried. Happy to share a 3-point audit for {{business}}.',
  },
  {
    id: 'd4-call-voicemail',
    day: 4,
    phase: 'Contacted',
    channel: 'Call',
    format: 'Call + voicemail',
    objective: 'Increase response probability',
    message: 'Left a quick voicemail: noticed {{painPoint}} trend with similar {{niche}} teams, can share ideas if useful.',
  },
  {
    id: 'd6-email-proof',
    day: 6,
    phase: 'Contacted',
    channel: 'Email',
    format: 'Case-study follow-up',
    objective: 'Build trust with proof',
    message: 'Sharing a short result snapshot from a similar client and the one change that moved conversion first.',
  },
  {
    id: 'd9-linkedin-value',
    day: 9,
    phase: 'Qualified',
    channel: 'LinkedIn',
    format: 'Value drop message',
    objective: 'Keep momentum without pressure',
    message: 'Recorded two opportunities on your funnel page; can send screenshots if helpful.',
  },
  {
    id: 'd11-call-checkin',
    day: 11,
    phase: 'Qualified',
    channel: 'Call',
    format: 'Call check-in',
    objective: 'Move to decision call',
    message: 'Quick check if you had a chance to review the recommendations and if timing makes sense this month.',
  },
  {
    id: 'd14-email-breakup',
    day: 14,
    phase: 'Proposal Sent',
    channel: 'Email',
    format: 'Polite close-the-loop',
    objective: 'Get definitive yes/no',
    message: 'Should I keep this open or close the file for now? Happy to reconnect whenever timing is better.',
  },
];

export function buildNurtureSequence(lead: Lead): NurtureStep[] {
  const painPoint = lead.painPoints[0] ?? `improving conversions for ${lead.niche}`;

  return defaultSequence.map((step) => ({
    ...step,
    message: step.message
      .replace('{{contact}}', lead.contactName)
      .replace('{{business}}', lead.businessName)
      .replace('{{painPoint}}', painPoint)
      .replace('{{niche}}', lead.niche),
  }));
}

export type LeadStatus = 'New' | 'Ready' | 'Contacted' | 'Qualified' | 'Proposal Sent' | 'Won' | 'Lost';

export interface OutreachBundle {
  emailSubject: string;
  emailBody: string;
  voicemailScript: string;
  linkedinMessage: string;
  bestFirstTouch: 'Email' | 'Voicemail' | 'LinkedIn';
}

export interface ActivityItem {
  id: string;
  label: string;
  timestamp: string;
}

export interface Lead {
  id: string;
  businessName: string;
  contactName: string;
  contactTitle: string;
  email: string;
  phone: string;
  website: string;
  linkedinUrl: string;
  niche: string;
  city: string;
  state: string;
  summary: string;
  painPoints: string[];
  personalizationHook: string;
  leadScore: number;
  status: LeadStatus;
  notes: string;
  outreach: OutreachBundle;
  activity: ActivityItem[];
}

export interface LeadSearchInput {
  niche: string;
  city: string;
  state: string;
  purpose: string;
}

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
  batchId?: string;
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
  scoreFactors: string[];
  status: LeadStatus;
  source: 'Generated' | 'Manual' | 'CSV Import' | 'LinkedIn' | 'Referral';
  followUpDate: string | null;
  createdAt: string;
  notes: string;
  outreach: OutreachBundle;
  activity: ActivityItem[];
}

export interface LeadSearchInput {
  niche: string;
  city: string;
  state: string;
  purpose: string;
  tone: 'Direct' | 'Friendly' | 'Formal';
}

export interface Account {
  id: string;
  businessName: string;
  website: string;
  primaryContact: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  niche: string;
  status: LeadStatus;
  lastActivityType?: ActivityType;
  lastActivityAt?: string;
  nextFollowUpAt?: string;
  notes?: string;
}

export type ActivityType = 'Email' | 'Call' | 'LinkedIn' | 'Note' | 'Status Change' | 'Task';

export interface ActivityRecord {
  id: string;
  accountId: string;
  type: ActivityType;
  summary: string;
  outcome?: string;
  timestamp: string;
}

export type TaskStatus = 'Open' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface FollowUpTask {
  id: string;
  accountId: string;
  title: string;
  dueAt: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  companyName: string;
  productService: string;
  outreachGoal: string;
  timezone: string;
}

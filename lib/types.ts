// ─── Pipeline Stages ─────────────────────────────────────────────────────────

/** Standard SMB pipeline */
export type LeadStatus =
  | 'New'
  | 'Ready'
  | 'Contacted'
  | 'Qualified'
  | 'Proposal Sent'
  | 'Won'
  | 'Lost'
  // Senior Living / Referral pipeline stages
  | 'Relationship Building'
  | 'Partner Qualified'
  | 'Partner Established'
  | 'Active Referrals'
  | 'Dormant';

// ─── Outreach ─────────────────────────────────────────────────────────────────

export interface OutreachBundle {
  emailSubject: string;
  emailBody: string;
  voicemailScript: string;
  linkedinMessage: string;
  bestFirstTouch: 'Email' | 'Voicemail' | 'LinkedIn';
}

// ─── Activity ────────────────────────────────────────────────────────────────

export interface ActivityItem {
  id: string;
  label: string;
  timestamp: string;
}

// ─── Referral / Senior Living fields ─────────────────────────────────────────

export type LeadType =
  | 'Standard'
  | 'Referral Partner'
  | 'Medical Facility'
  | 'Professional Influencer'
  | 'Community Organization'
  | 'Senior Living Community'
  | 'Family Decision Support';

export type ReferralType =
  | 'Hospital'
  | 'Rehab Facility'
  | 'Skilled Nursing'
  | 'Elder Law Attorney'
  | 'Financial Advisor'
  | 'Home Care Agency'
  | 'Placement Agency'
  | 'Geriatric Care Manager'
  | 'Church / Community'
  | 'Other';

export type EstimatedReferralVolume = 'Low' | 'Medium' | 'High';
export type PartnerStatus = 'Prospect' | 'Active' | 'Dormant' | 'Churned';

// ─── Core Lead record ─────────────────────────────────────────────────────────

export interface Lead {
  // Identity
  id: string;
  apolloId: string | null;
  batchId: string;
  createdAt: string;

  // Contact info
  businessName: string;
  contactName: string;
  contactTitle: string;
  email: string;
  phone: string;
  website: string;
  linkedinUrl: string;

  // Niche / location
  niche: string;
  city: string;
  state: string;

  // AI-generated intelligence
  summary: string;
  painPoints: string[];
  personalizationHook: string;

  // Scoring
  leadScore: number;
  scoreFactors?: string[];
  /** For referral partners: how strongly they influence placement decisions (1–100) */
  referralInfluenceScore?: number;
  /** 1–5 relationship quality rating */
  relationshipStrength?: 1 | 2 | 3 | 4 | 5;

  // Pipeline
  status: LeadStatus;
  source?: 'Generated' | 'Apollo' | 'Manual' | 'CSV Import' | 'LinkedIn' | 'Referral';

  // Follow-up
  followUpDate?: string | null;

  // Notes / outreach
  notes: string;
  outreach: OutreachBundle;
  activity: ActivityItem[];

  // ── Senior Living / Referral fields (optional — non-SL leads leave blank) ──
  leadType?: LeadType;
  referralType?: ReferralType;
  organizationType?: string;
  contactRole?: string;
  /** 'referral-ecosystem' | 'digital' | 'community' | 'smb' */
  sourceChannel?: string;
  estimatedReferralVolume?: EstimatedReferralVolume;
  partnerStatus?: PartnerStatus;
  territory?: string;
  lastMeaningfulTouch?: string;
  moveInAttribution?: string;
  referralHistory?: Array<{ date: string; outcome: string; residentName?: string }>;
}

// ─── Search input ─────────────────────────────────────────────────────────────

export interface LeadSearchInput {
  niche: string;
  city: string;
  state: string;
  purpose: string;
  count: number;
  tone?: 'Direct' | 'Friendly' | 'Formal';
}

// ─── Account (org-level) ─────────────────────────────────────────────────────

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

// ─── Activity tracking ───────────────────────────────────────────────────────

export type ActivityType = 'Email' | 'Call' | 'LinkedIn' | 'Note' | 'Status Change' | 'Task' | 'Referral Received';

export interface ActivityRecord {
  id: string;
  accountId: string;
  type: ActivityType;
  summary: string;
  outcome?: string;
  timestamp: string;
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

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

// ─── User profile ─────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  companyName: string;
  role: string;
  productService: string;
  elevatorPitch: string;
  targetNiches: string[];
  targetCities: Array<{ city: string; state: string }>;
  defaultTone: 'Direct' | 'Friendly' | 'Formal';
  monthlyLeadGoal: number;
  timezone: string;
  avatarColor: string;
  createdAt: string;
  updatedAt: string;
}

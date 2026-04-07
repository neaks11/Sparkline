import { Account, ActivityRecord, Lead } from '@/lib/types';

export function mapLeadToAccount(lead: Lead): Account {
  const mostRecent = lead.activity.at(-1);
  return {
    id: lead.id,
    businessName: lead.businessName,
    website: lead.website,
    primaryContact: lead.contactName,
    email: lead.email,
    phone: lead.phone,
    city: lead.city,
    state: lead.state,
    niche: lead.niche,
    status: lead.status,
    lastActivityType: mostRecent ? 'Status Change' : undefined,
    lastActivityAt: mostRecent?.timestamp,
    notes: lead.notes,
  };
}

export function mapLeadActivities(lead: Lead): ActivityRecord[] {
  return lead.activity.map((item) => ({
    id: item.id,
    accountId: lead.id,
    type: 'Status Change',
    summary: item.label,
    timestamp: item.timestamp,
  }));
}

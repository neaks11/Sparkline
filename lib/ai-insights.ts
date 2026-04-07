import { Lead, OutreachBundle } from '@/lib/types';

export type Persona = 'Owner' | 'Ops Manager' | 'Marketing Lead' | 'General';

export interface ObjectionPrediction {
  objection: string;
  response: string;
}

export interface ChannelRecommendation {
  channel: OutreachBundle['bestFirstTouch'];
  score: number;
  reason: string;
}

export function detectPersona(contactTitle: string): Persona {
  const title = contactTitle.toLowerCase();
  if (title.includes('owner') || title.includes('founder') || title.includes('ceo')) return 'Owner';
  if (title.includes('ops') || title.includes('operations') || title.includes('manager')) return 'Ops Manager';
  if (title.includes('marketing') || title.includes('growth') || title.includes('demand gen')) return 'Marketing Lead';
  return 'General';
}

export function buildLeadBrief(lead: Lead): string[] {
  const trigger = lead.leadScore >= 85
    ? 'high buying intent score and recent pipeline fit signals'
    : 'moderate intent score with strong local relevance';
  return [
    `${lead.businessName} appears to be a ${lead.niche} business in ${lead.city}, ${lead.state}.`,
    `Likely priority: improving predictable lead flow and response speed without adding operational overhead.`,
    `Decision-maker context: ${lead.contactName} (${lead.contactTitle}) is likely focused on revenue efficiency and execution risk.`,
    `Growth trigger detected: ${trigger}.`,
    `Suggested angle: tie your offer to ${lead.painPoints[0]?.toLowerCase() ?? 'better lead-to-customer conversion'} and show a low-friction first win in 7-14 days.`,
  ];
}

export function predictObjections(lead: Lead): ObjectionPrediction[] {
  return [
    {
      objection: 'Budget is tight right now.',
      response: `Start with a narrow pilot for ${lead.businessName} and measure booked calls before expanding spend.`,
    },
    {
      objection: 'We already have a process in place.',
      response: `Position your offer as a layer that improves ${lead.painPoints[0]?.toLowerCase() ?? 'conversion consistency'} without replacing existing tools.`,
    },
    {
      objection: 'Timing is bad this month.',
      response: 'Offer a lightweight teardown now and schedule implementation next cycle to reduce timing pressure.',
    },
    {
      objection: 'Not sure this is the right fit.',
      response: `Share one niche-specific example from ${lead.niche} and define a clear success metric for the first 30 days.`,
    },
  ];
}

export function recommendChannels(lead: Lead): ChannelRecommendation[] {
  const email = {
    channel: 'Email' as const,
    score: lead.leadScore >= 80 ? 92 : 80,
    reason: 'Best for structured value delivery and easy forwarding to decision makers.',
  };
  const linkedin = {
    channel: 'LinkedIn' as const,
    score: lead.contactTitle.toLowerCase().includes('owner') ? 78 : 86,
    reason: 'Useful for warm visibility and social proof before call outreach.',
  };
  const voicemail = {
    channel: 'Voicemail' as const,
    score: lead.status === 'Contacted' ? 70 : 82,
    reason: 'Strong for pattern interrupt when inbox response is slow.',
  };

  return [email, linkedin, voicemail].sort((a, b) => b.score - a.score);
}

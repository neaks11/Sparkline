import { isMedSpaNiche } from '@/lib/niches';
import { buildOutreach } from '@/lib/outreach-generator';
import { Lead, LeadSearchInput } from '@/lib/types';

const firstNames = ['Alex', 'Jordan', 'Casey', 'Taylor', 'Riley', 'Avery', 'Morgan', 'Cameron', 'Parker', 'Drew'];
const lastNames = ['Martinez', 'Brooks', 'Bennett', 'Kim', 'Patel', 'Reed', 'Turner', 'Foster', 'Hughes', 'Price'];
const companyPrefixes = ['Summit', 'Bright', 'Metro', 'Prime', 'BlueSky', 'Evergreen', 'NorthStar', 'Vertex', 'Ironwood', 'Anchor'];
const companySuffixes = ['Group', 'Partners', 'Co', 'Pros', 'Solutions', 'Experts', 'Works', 'Studio', 'Collective', 'Services'];

const nichePainPoints: Record<string, string[]> = {
  hvac: ['slow follow-up on quote requests', 'seasonal demand spikes causing missed calls', 'low Google review velocity', 'inconsistent technician utilization'],
  'med spas': ['high consultation inquiry drop-off', 'manual follow-up from front desk staff', 'missed-call leads not getting text-back', 'inconsistent review reactivation cadence', 'limited conversion from treatment pages'],
  landscaping: ['off-season revenue dips', 'manual estimate process', 'inconsistent route density', 'difficulty upselling maintenance packages'],
};

const genericHooks = [
  'your recent 5-star review streak',
  'your team hiring post on LinkedIn',
  'your seasonal promotion on your homepage',
  'your visible service-area expansion',
];

const medSpaHooks = [
  'your injector-focused before/after gallery',
  'your treatment mix around Botox, filler, and skin packages',
  'your consultation booking CTA placement',
  'recent comments mentioning front desk friendliness',
  'your membership and package offer messaging',
];

const medSpaSignals = [
  'no visible chatbot or FAQ assistant for consultation questions',
  'booking flow appears to require too many clicks',
  'review recency is inconsistent over the last 60 days',
  'strong treatment menu but weak lead capture prompts',
  'limited social proof near high-intent service pages',
  'missed-call text-back workflow is not obvious',
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

function getPainPoints(niche: string): string[] {
  const key = niche.toLowerCase();
  const matched = Object.entries(nichePainPoints).find(([k]) => key.includes(k));
  const base = matched ? matched[1] : [
    'manual lead qualification consuming owner time',
    'inconsistent follow-up sequencing',
    'limited visibility into conversion performance',
    'difficulty standing out in local search',
  ];

  return [...base].sort(() => 0.5 - Math.random()).slice(0, 2 + Math.floor(Math.random() * 3));
}

function buildLeadScore(niche: string, signals: string[]): number {
  let score = Math.floor(Math.random() * 30) + 60;
  if (isMedSpaNiche(niche)) {
    score += Math.min(20, signals.length * 5);
  }
  return Math.min(99, Math.max(1, score));
}

export function generateSampleLeads(input: LeadSearchInput): Lead[] {
  return Array.from({ length: 10 }, (_, index) => {
    const firstName = randomFrom(firstNames);
    const lastName = randomFrom(lastNames);
    const contactName = `${firstName} ${lastName}`;
    const businessName = `${randomFrom(companyPrefixes)} ${input.niche} ${randomFrom(companySuffixes)}`
      .replace(/\s+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
    const domainRoot = slugify(businessName).replace(/-+/g, '');
    const painPoints = getPainPoints(input.niche);
    const signals = isMedSpaNiche(input.niche) ? [...medSpaSignals].sort(() => 0.5 - Math.random()).slice(0, 3) : [];
    const leadScore = buildLeadScore(input.niche, signals);

    const lead: Lead = {
      id: `${Date.now()}-${index + 1}`,
      businessName,
      contactName,
      contactTitle: randomFrom(['Owner', 'General Manager', 'Operations Manager', 'Marketing Director']),
      email: `${firstName.toLowerCase()}@${domainRoot}.com`,
      phone: `(555) ${Math.floor(100 + Math.random() * 899)}-${Math.floor(1000 + Math.random() * 8999)}`,
      website: `https://www.${domainRoot}.com`,
      linkedinUrl: `https://www.linkedin.com/company/${slugify(businessName)}`,
      niche: input.niche,
      city: input.city,
      state: input.state,
      summary: isMedSpaNiche(input.niche)
        ? `${businessName} is a med spa in ${input.city} focused on cosmetic injectables, skin treatments, and consult-driven booking. The brand looks credible, but the consultation funnel likely has conversion room.`
        : `${businessName} is a ${input.niche.toLowerCase()} provider serving ${input.city} with a reputation for responsive service and local credibility. They appear growth-oriented and likely focused on filling their pipeline with qualified opportunities.`,
      painPoints,
      personalizationHook: randomFrom(isMedSpaNiche(input.niche) ? medSpaHooks : genericHooks),
      leadScore,
      status: leadScore > 82 ? 'Ready' : 'New',
      notes: input.purpose ?? '',
      medSpaSignals: signals,
      outreach: {
        emailSubject: '',
        emailBody: '',
        voicemailScript: '',
        linkedinMessage: '',
        bestFirstTouch: 'Email',
      },
      activity: [{ id: crypto.randomUUID(), label: 'Lead generated', timestamp: new Date().toISOString() }],
    };

    lead.outreach = buildOutreach(lead, input.purpose);
    return lead;
  });
}

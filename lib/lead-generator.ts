import { buildOutreach } from '@/lib/outreach-generator';
import { Lead, LeadSearchInput } from '@/lib/types';

const firstNames = ['Alex', 'Jordan', 'Casey', 'Taylor', 'Riley', 'Avery', 'Morgan', 'Cameron', 'Parker', 'Drew'];
const lastNames = ['Martinez', 'Brooks', 'Bennett', 'Kim', 'Patel', 'Reed', 'Turner', 'Foster', 'Hughes', 'Price'];
const companyPrefixes = ['Summit', 'Bright', 'Metro', 'Prime', 'BlueSky', 'Evergreen', 'NorthStar', 'Vertex', 'Ironwood', 'Anchor'];
const companySuffixes = ['Group', 'Partners', 'Co', 'Pros', 'Solutions', 'Experts', 'Works', 'Studio', 'Collective', 'Services'];

const nichePainPoints: Record<string, string[]> = {
  hvac: ['slow follow-up on quote requests', 'seasonal demand spikes causing missed calls', 'low Google review velocity', 'inconsistent technician utilization'],
  'med spas': ['high lead cost from paid social', 'appointment no-shows', 'underperforming reactivation campaigns', 'limited referral tracking'],
  landscaping: ['off-season revenue dips', 'manual estimate process', 'inconsistent route density', 'difficulty upselling maintenance packages'],
};

const hooks = [
  'your recent 5-star review streak',
  'your before/after project gallery',
  'your team hiring post on LinkedIn',
  'your seasonal promotion on your homepage',
  'your visible service-area expansion',
  'your strong neighborhood reputation mentions',
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
    const leadScore = Math.floor(Math.random() * 35) + 65;

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
      summary: `${businessName} is a ${input.niche.toLowerCase()} provider serving ${input.city} with a reputation for responsive service and local credibility. They appear growth-oriented and likely focused on filling their pipeline with qualified opportunities.`,
      painPoints,
      personalizationHook: randomFrom(hooks),
      leadScore,
      status: leadScore > 80 ? 'Ready' : 'New',
      notes: input.notes ?? '',
      outreach: {
        emailSubject: '',
        emailBody: '',
        voicemailScript: '',
        linkedinMessage: '',
        bestFirstTouch: 'Email',
      },
      activity: [{ id: crypto.randomUUID(), label: 'Lead generated', timestamp: new Date().toISOString() }],
    };

    lead.outreach = buildOutreach(lead, input.notes);
    return lead;
  });
}

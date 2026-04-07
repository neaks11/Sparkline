import { buildOutreach } from '@/lib/outreach-generator';
import { Lead, LeadSearchInput } from '@/lib/types';

// ─── Mock data fallback ───────────────────────────────────────────────────────

const firstNames = ['Alex','Jordan','Casey','Taylor','Riley','Avery','Morgan','Cameron','Parker','Drew','Sam','Jamie','Blake','Reese','Quinn'];
const lastNames = ['Martinez','Brooks','Bennett','Kim','Patel','Reed','Turner','Foster','Hughes','Price','Cohen','Nguyen','Davis','Walker','Okafor'];
const companyPrefixes = ['Summit','Bright','Metro','Prime','BlueSky','Evergreen','NorthStar','Vertex','Ironwood','Anchor','Apex','Crestview','Pinnacle','Clearwater','Redwood'];
const companySuffixes = ['Group','Partners','Co','Pros','Solutions','Experts','Works','Studio','Collective','Services','Team','Associates'];

const nichePainPoints: Record<string, string[]> = {
  hvac: ['slow follow-up on quote requests','seasonal demand spikes causing missed calls','low Google review velocity','inconsistent technician utilization'],
  'med spas': ['high lead cost from paid social','appointment no-shows','underperforming reactivation campaigns','limited referral tracking'],
  landscaping: ['off-season revenue dips','manual estimate process','inconsistent route density','difficulty upselling maintenance packages'],
  plumbing: ['after-hours emergency call routing','manual dispatch inefficiencies','low repeat-customer rate','no automated review requests'],
  roofing: ['long sales cycles on residential jobs','storm-chasing seasonality','difficulty tracking job-site photos','missed upsell on gutters/insulation'],
  dental: ['no-show and last-minute cancellations','poor reactivation of inactive patients','low treatment plan acceptance rate','manual insurance verification delays'],
  legal: ['slow intake form follow-up','no automated consultation reminders','poor Google ranking vs. larger firms','limited referral partner tracking'],
  'real estate': ['unresponsive lead nurture sequences','manually sending CMAs','low open house follow-up rate','weak social media presence'],
  cleaning: ['high customer churn after first booking','manual scheduling causing double-books','no automated upsell to recurring plans','inconsistent cleaner assignment'],
  auto: ['missed service reminder follow-ups','no review request workflow','manual parts ordering delays','low upsell on preventive maintenance'],
};

const hooks = [
  'your recent 5-star review streak','your before/after project gallery',
  'your team hiring post on LinkedIn','your seasonal promotion on your homepage',
  'your visible service-area expansion','your strong neighborhood reputation mentions',
  'your recent community sponsorship post','your new service offering announcement',
];

function randomFrom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function slugify(v: string) { return v.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)+/g,''); }

function getPainPoints(niche: string): string[] {
  const key = niche.toLowerCase();
  const matched = Object.entries(nichePainPoints).find(([k]) => key.includes(k));
  const base = matched ? matched[1] : [
    'manual lead qualification consuming owner time','inconsistent follow-up sequencing',
    'limited visibility into conversion performance','difficulty standing out in local search',
  ];
  return [...base].sort(() => 0.5 - Math.random()).slice(0, 2 + Math.floor(Math.random() * 3));
}

function mockLead(input: LeadSearchInput, batchId: string, index: number): Lead {
  const firstName = randomFrom(firstNames);
  const lastName = randomFrom(lastNames);
  const businessName = `${randomFrom(companyPrefixes)} ${input.niche} ${randomFrom(companySuffixes)}`
    .replace(/\s+/g,' ').replace(/\b\w/g, c => c.toUpperCase());
  const domain = slugify(businessName).replace(/-+/g,'');
  const painPoints = getPainPoints(input.niche);
  const leadScore = Math.floor(Math.random() * 35) + 65;
  const now = new Date().toISOString();

  const lead: Lead = {
    id: `${batchId}-${index + 1}`,
    apolloId: null,
    batchId,
    createdAt: now,
    businessName,
    contactName: `${firstName} ${lastName}`,
    contactTitle: randomFrom(['Owner','General Manager','Operations Manager','Marketing Director']),
    email: `${firstName.toLowerCase()}@${domain}.com`,
    phone: `(555) ${Math.floor(100+Math.random()*899)}-${Math.floor(1000+Math.random()*8999)}`,
    website: `https://www.${domain}.com`,
    linkedinUrl: `https://www.linkedin.com/company/${slugify(businessName)}`,
    niche: input.niche,
    city: input.city,
    state: input.state,
    summary: `${businessName} is a ${input.niche.toLowerCase()} provider serving ${input.city} with a reputation for responsive service and local credibility.`,
    painPoints,
    personalizationHook: randomFrom(hooks),
    leadScore,
    status: leadScore > 90 ? 'Qualified' : leadScore > 80 ? 'Ready' : 'New',
    notes: `Offer context: ${input.purpose}`,
    outreach: { emailSubject:'', emailBody:'', voicemailScript:'', linkedinMessage:'', bestFirstTouch:'Email' },
    source: 'Generated' as const,
    activity: [{ id: crypto.randomUUID(), label: 'Lead generated (mock)', timestamp: now }],
  };
  lead.outreach = buildOutreach(lead, input.purpose);
  return lead;
}

// ─── Apollo response → Lead mapper ───────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function apolloPersonToLead(person: any, input: LeadSearchInput, batchId: string, index: number): Lead {
  const org = person.organization ?? {};
  const phone = person.phone_numbers?.[0]?.sanitized_number ?? person.phone_numbers?.[0]?.raw_number ?? '';
  const painPoints = getPainPoints(input.niche);
  const leadScore = Math.floor(Math.random() * 25) + 75; // Apollo leads skew higher
  const now = new Date().toISOString();

  const lead: Lead = {
    id: `${batchId}-${index + 1}`,
    apolloId: person.id ?? null,
    batchId,
    createdAt: now,
    businessName: org.name ?? person.organization_name ?? 'Unknown Company',
    contactName: person.name ?? `${person.first_name ?? ''} ${person.last_name ?? ''}`.trim(),
    contactTitle: person.title ?? '',
    email: person.email ?? '',
    phone,
    website: org.website_url ?? '',
    linkedinUrl: person.linkedin_url ?? '',
    niche: input.niche,
    city: person.city ?? input.city,
    state: person.state ?? input.state,
    summary: `${org.name ?? 'This company'} is a ${input.niche.toLowerCase()} provider serving ${person.city ?? input.city}. ${person.headline ?? ''}`.trim(),
    painPoints,
    personalizationHook: randomFrom(hooks),
    leadScore,
    status: leadScore > 90 ? 'Qualified' : leadScore > 80 ? 'Ready' : 'New',
    notes: `Offer context: ${input.purpose}`,
    outreach: { emailSubject:'', emailBody:'', voicemailScript:'', linkedinMessage:'', bestFirstTouch:'Email' },
    source: 'Apollo' as const,
    activity: [{ id: crypto.randomUUID(), label: 'Lead imported from Apollo', timestamp: now }],
  };
  lead.outreach = buildOutreach(lead, input.purpose);
  return lead;
}

// ─── Apollo search call (client → /api/apollo proxy) ─────────────────────────

async function fetchFromApollo(input: LeadSearchInput, batchId: string): Promise<Lead[] | null> {
  try {
    const location = `${input.city}, ${input.state}, United States`;
    const payload = {
      q_keywords: input.niche,
      person_titles: ['Owner', 'CEO', 'President', 'General Manager', 'Operations Manager', 'Founder'],
      person_locations: [location],
      contact_email_status: ['verified', 'guessed', 'unverified'],
      page: 1,
      per_page: Math.min(input.count ?? 10, 25),
    };

    const res = await fetch('/api/apollo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.status === 501) return null; // No API key — fall back to mock
    if (!res.ok) {
      console.error('Apollo API error:', res.status);
      return null;
    }

    const data = await res.json();
    const people = data.people ?? [];

    if (!people.length) return null;

    return people.map((p: unknown, i: number) => apolloPersonToLead(p, input, batchId, i));
  } catch (err) {
    console.error('Apollo fetch failed:', err);
    return null;
  }
}

// ─── Public export ────────────────────────────────────────────────────────────

export async function generateSampleLeads(input: LeadSearchInput, batchId: string): Promise<{ leads: Lead[]; source: 'apollo' | 'mock' }> {
  const apolloLeads = await fetchFromApollo(input, batchId);

  if (apolloLeads && apolloLeads.length > 0) {
    return { leads: apolloLeads, source: 'apollo' };
  }

  // Fall back to mock
  const count = Math.min(Math.max(input.count ?? 10, 5), 25);
  const leads = Array.from({ length: count }, (_, i) => mockLead(input, batchId, i));
  return { leads, source: 'mock' };
}

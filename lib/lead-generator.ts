import { buildOutreach } from '@/lib/outreach-generator';
import { isReferralSourceNiche, isSeniorLivingNiche } from '@/lib/niches';
import { EstimatedReferralVolume, Lead, LeadSearchInput, LeadStatus, LeadType, ReferralType } from '@/lib/types';

// ─── Name / company pools ─────────────────────────────────────────────────────

const firstNames = ['Alex','Jordan','Casey','Taylor','Riley','Avery','Morgan','Cameron','Parker','Drew','Sam','Jamie','Blake','Reese','Quinn','Susan','Linda','Karen','Patricia','Barbara','Michael','David','James','Robert','William'];
const lastNames = ['Martinez','Brooks','Bennett','Kim','Patel','Reed','Turner','Foster','Hughes','Price','Cohen','Nguyen','Davis','Walker','Okafor','Johnson','Williams','Brown','Jones','Garcia'];
const companyPrefixes = ['Summit','Bright','Metro','Prime','BlueSky','Evergreen','NorthStar','Vertex','Ironwood','Anchor','Apex','Crestview','Pinnacle','Clearwater','Redwood'];
const companySuffixes = ['Group','Partners','Co','Pros','Solutions','Experts','Works','Studio','Collective','Services','Team','Associates'];

// ─── Senior Living org name pools ────────────────────────────────────────────

const slPrefixes = ['Sunrise','Harmony','Serenity','Meadowbrook','Willow','Heritage','Cypress','Oakwood','Riverview','Lakeshore','Pines','Majestic','Grandview','Belmont','Canterbury'];
const slSuffixes = ['Gardens','Place','Manor','Commons','Estates','Village','Court','Terrace','Landing','Crossing','Lodge','Community','Center','Home','Living'];

const hospitalNames = ['Regional Medical Center','Memorial Hospital','St. Mary\'s Hospital','University Health System','Community Hospital','General Hospital','Methodist Medical','Mercy Medical Center','Presbyterian Hospital','Kindred Hospital'];
const rehabNames = ['Select Rehabilitation','Encompass Health','Kindred Rehab','Genesis Rehab','Advanced Recovery Center','Physical Therapy Associates','SportsCare Rehab','Outpatient Rehab Center','ProMotion Physical Therapy','Rehab Care Group'];
const snfNames = ['Skilled Nursing & Rehab','Post-Acute Care Center','Extended Care Facility','Healthcare & Rehabilitation','Nursing & Rehab Center','Long-Term Care Center','Transitional Care Unit','Convalescent Care Center','Sub-Acute Rehab','Recovery Care Center'];
const elderLawNames = ['Elder Law Firm','Elder Care Law Group','Seniors\' Legal Services','Life Planning Law','Estate & Elder Law','Trusts & Elder Care Attorney','Geriatric Legal Associates','Senior Rights Law Group','Planning for Life Law','Elder Justice Law Center'];
const homeCareNames = ['Home Instead','Visiting Angels','Comfort Keepers','Right at Home','BrightSpring Home Services','Amedisys Home Health','LHC Group Home Care','Bayada Home Health','Interim HealthCare','Senior Helpers'];
const placementNames = ['A Place for Mom','Senior Living Advisors','Assisted Living Locators','Senior Care Authority','Care Patrol','Oasis Senior Advisors','Senior Resource Group','Senior Living Guide','Placement Angels','Senior Living Specialists'];

// ─── Pain points by niche ────────────────────────────────────────────────────

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
  // Senior Living – community pain points
  'assisted living': ['low occupancy during census dips','inconsistent referral partner follow-up','families not moving forward after tours','discharge planner relationships going cold'],
  'memory care': ['family trust barriers slowing move-in decisions','lack of specialized outreach to medical partners','high lead cost from directories','staff turnover affecting family confidence'],
  'independent living': ['difficulty differentiating from competitors','low conversion on digital inquiries','aging referral partner relationships','limited community presence'],
  'senior care': ['referral partner outreach inconsistency','slow response to hospital discharge requests','limited follow-up after community events','manual tracking of referral sources'],
  // Referral source pain points
  'hospital': ['discharge delays due to limited placement options','care transition coordination gaps','patients readmitting due to poor placement fit','inadequate post-acute partner network'],
  'discharge': ['limited vetted placement options','time pressure on care transitions','family education on care levels','coordination gaps with community teams'],
  'skilled nursing': ['low census during slow seasons','limited community partner relationships','referral reciprocity challenges','family outreach after skilled stay'],
  'rehab center': ['post-rehab placement gaps for long-term care','limited connection to assisted living partners','family decision support resources','care transition documentation'],
  'elder law': ['client families overwhelmed by care decisions','limited trusted placement referrals','care cost planning complexity','Medicaid and asset planning under time pressure'],
  'home care': ['client progression to higher levels of care','limited assisted living partner network','caregiver availability matching care needs','transitioning families to residential care'],
  'placement': ['limited vetted community inventory','family trust barriers early in process','care assessment complexity','community capacity and availability tracking'],
  'geriatric': ['coordinating care across multiple providers','limited referral relationships with communities','family caregiver burnout','care level transition timing'],
  'financial advisor': ['clients unprepared for care costs','limited knowledge of care funding options','Medicaid planning referral needs','care cost impact on estate plans'],
  'churches': ['congregant families in crisis without guidance','limited trusted care referrals','community caregiver support resources','bereavement and senior isolation programs'],
};

// ─── Referral-source hooks ────────────────────────────────────────────────────

const standardHooks = [
  'your recent 5-star review streak','your before/after project gallery',
  'your team hiring post on LinkedIn','your seasonal promotion on your homepage',
  'your visible service-area expansion','your strong neighborhood reputation mentions',
  'your recent community sponsorship post','your new service offering announcement',
];

const referralHooks = [
  'your role in care transitions for patients in this region',
  'your reputation for smooth discharge planning',
  'your work connecting families with trusted care options',
  'your specialization in elder law and life care planning',
  'your community standing in senior services',
  'your team\'s focus on post-acute coordination',
  'your involvement in local senior care networks',
  'your placement work with families navigating care decisions',
];

// ─── Contact roles by niche ───────────────────────────────────────────────────

const contactRolesByNiche: Record<string, string[]> = {
  hospital: ['Discharge Planner', 'Case Manager', 'Social Worker', 'Care Transitions Coordinator', 'Director of Case Management'],
  discharge: ['Discharge Planner', 'Case Manager', 'Social Worker'],
  'skilled nursing': ['Administrator', 'Director of Nursing', 'Social Services Director', 'Admissions Coordinator'],
  rehab: ['Director of Rehab', 'Case Manager', 'Social Worker', 'Patient Care Coordinator'],
  'elder law': ['Elder Law Attorney', 'Paralegal', 'Life Care Planner', 'Estate Planning Attorney'],
  'home care': ['Care Coordinator', 'Client Services Director', 'Intake Coordinator', 'RN Case Manager'],
  placement: ['Senior Living Advisor', 'Care Advisor', 'Placement Specialist', 'Family Consultant'],
  geriatric: ['Geriatric Care Manager', 'Aging Life Care Professional', 'Care Coordinator'],
  'financial advisor': ['Financial Advisor', 'Wealth Manager', 'Elder Care Financial Planner'],
  church: ['Pastor', 'Senior Ministry Coordinator', 'Community Outreach Director', 'Deacon'],
  'assisted living': ['Executive Director', 'Director of Sales & Marketing', 'Community Relations Director', 'Admissions Coordinator'],
  'memory care': ['Executive Director', 'Memory Care Director', 'Director of Sales', 'Community Liaison'],
  'independent living': ['Executive Director', 'Marketing Director', 'Community Relations Manager'],
};

// ─── Lead type + referral type mapping ───────────────────────────────────────

function inferLeadType(niche: string): LeadType {
  const n = niche.toLowerCase();
  if (n.includes('hospital') || n.includes('discharge') || n.includes('skilled nursing') || n.includes('rehab')) return 'Medical Facility';
  if (n.includes('elder law') || n.includes('financial advisor') || n.includes('geriatric') || n.includes('placement')) return 'Professional Influencer';
  if (n.includes('home care')) return 'Referral Partner';
  if (n.includes('church') || n.includes('community')) return 'Community Organization';
  if (n.includes('assisted') || n.includes('memory') || n.includes('independent') || n.includes('senior care')) return 'Senior Living Community';
  return 'Standard';
}

function inferReferralType(niche: string): ReferralType | undefined {
  const n = niche.toLowerCase();
  if (n.includes('hospital') || n.includes('discharge')) return 'Hospital';
  if (n.includes('rehab')) return 'Rehab Facility';
  if (n.includes('skilled nursing')) return 'Skilled Nursing';
  if (n.includes('elder law')) return 'Elder Law Attorney';
  if (n.includes('financial advisor')) return 'Financial Advisor';
  if (n.includes('home care')) return 'Home Care Agency';
  if (n.includes('placement')) return 'Placement Agency';
  if (n.includes('geriatric')) return 'Geriatric Care Manager';
  if (n.includes('church') || n.includes('community')) return 'Church / Community';
  return undefined;
}

function inferEstimatedReferralVolume(niche: string): EstimatedReferralVolume {
  const n = niche.toLowerCase();
  if (n.includes('hospital') || n.includes('skilled nursing') || n.includes('rehab') || n.includes('placement')) return 'High';
  if (n.includes('elder law') || n.includes('home care') || n.includes('geriatric') || n.includes('financial')) return 'Medium';
  return 'Low';
}

function inferReferralInfluenceScore(niche: string): number {
  const n = niche.toLowerCase();
  if (n.includes('hospital') || n.includes('discharge')) return Math.floor(Math.random() * 15) + 80; // 80–95
  if (n.includes('skilled nursing') || n.includes('placement')) return Math.floor(Math.random() * 15) + 75; // 75–90
  if (n.includes('elder law') || n.includes('geriatric')) return Math.floor(Math.random() * 15) + 70; // 70–85
  if (n.includes('home care') || n.includes('financial')) return Math.floor(Math.random() * 20) + 60; // 60–80
  return Math.floor(Math.random() * 20) + 50; // 50–70
}

// ─── Organization name generators ────────────────────────────────────────────

function seniorLivingOrgName(niche: string, city: string): string {
  const n = niche.toLowerCase();
  const prefix = randomFrom(slPrefixes);
  const suffix = randomFrom(slSuffixes);
  if (n.includes('hospital')) return `${city} ${randomFrom(hospitalNames)}`;
  if (n.includes('rehab')) return `${city} ${randomFrom(rehabNames)}`;
  if (n.includes('skilled nursing')) return `${city} ${randomFrom(snfNames)}`;
  if (n.includes('elder law')) return `${randomFrom(lastNames)} ${randomFrom(elderLawNames)}`;
  if (n.includes('home care')) return randomFrom(homeCareNames);
  if (n.includes('placement')) return randomFrom(placementNames);
  if (n.includes('geriatric')) return `${city} Geriatric Care Associates`;
  if (n.includes('financial')) return `${randomFrom(lastNames)} Financial Group`;
  if (n.includes('church') || n.includes('community')) return `${prefix} Community Church of ${city}`;
  return `${prefix} ${suffix}`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomFrom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function slugify(v: string) { return v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''); }

function getPainPoints(niche: string): string[] {
  const key = niche.toLowerCase();
  const matched = Object.entries(nichePainPoints).find(([k]) => key.includes(k));
  const base = matched ? matched[1] : [
    'manual lead qualification consuming owner time', 'inconsistent follow-up sequencing',
    'limited visibility into conversion performance', 'difficulty standing out in local search',
  ];
  return [...base].sort(() => 0.5 - Math.random()).slice(0, 2 + Math.floor(Math.random() * 3));
}

function getContactRole(niche: string): string {
  const n = niche.toLowerCase();
  const matched = Object.entries(contactRolesByNiche).find(([k]) => n.includes(k));
  if (matched) return randomFrom(matched[1]);
  return randomFrom(['Owner', 'General Manager', 'Operations Manager', 'Marketing Director']);
}

function getInitialStatus(leadScore: number, isSL: boolean, isReferral: boolean): LeadStatus {
  if (isReferral) return 'New'; // Referral partners always start at New
  if (leadScore > 90) return isSL ? 'Partner Qualified' : 'Qualified';
  if (leadScore > 80) return isSL ? 'Contacted' : 'Ready';
  return 'New';
}

// ─── Mock lead builder ────────────────────────────────────────────────────────

function mockLead(input: LeadSearchInput, batchId: string, index: number): Lead {
  const isSL = isSeniorLivingNiche(input.niche);
  const isReferral = isReferralSourceNiche(input.niche);

  const firstName = randomFrom(firstNames);
  const lastName = randomFrom(lastNames);

  const businessName = isSL
    ? seniorLivingOrgName(input.niche, input.city)
    : `${randomFrom(companyPrefixes)} ${input.niche} ${randomFrom(companySuffixes)}`
        .replace(/\s+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const domain = slugify(businessName).replace(/-+/g, '').slice(0, 30);
  const painPoints = getPainPoints(input.niche);
  const leadScore = Math.floor(Math.random() * 35) + 65;
  const referralInfluenceScore = isSL ? inferReferralInfluenceScore(input.niche) : undefined;
  const now = new Date().toISOString();

  const contactRole = isSL ? getContactRole(input.niche) : randomFrom(['Owner', 'General Manager', 'Operations Manager', 'Marketing Director']);
  const leadType = isSL ? inferLeadType(input.niche) : 'Standard';
  const referralType = isReferral ? inferReferralType(input.niche) : undefined;
  const estimatedReferralVolume = isReferral ? inferEstimatedReferralVolume(input.niche) : undefined;

  const hook = randomFrom(isSL ? referralHooks : standardHooks);

  const summary = isSL
    ? `${businessName} is a ${input.niche.toLowerCase()} organization in ${input.city} with influence over local care placement decisions. ${contactRole} ${firstName} ${lastName} is a key contact for referral relationship development.`
    : `${businessName} is a ${input.niche.toLowerCase()} provider serving ${input.city} with a reputation for responsive service and local credibility.`;

  const lead: Lead = {
    id: `${batchId}-${index + 1}`,
    apolloId: null,
    batchId,
    createdAt: now,
    businessName,
    contactName: `${firstName} ${lastName}`,
    contactTitle: contactRole,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}.com`,
    phone: `(555) ${Math.floor(100 + Math.random() * 899)}-${Math.floor(1000 + Math.random() * 8999)}`,
    website: `https://www.${domain}.com`,
    linkedinUrl: `https://www.linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
    niche: input.niche,
    city: input.city,
    state: input.state,
    summary,
    painPoints,
    personalizationHook: hook,
    leadScore,
    referralInfluenceScore,
    status: getInitialStatus(leadScore, isSL, isReferral),
    notes: `Offer context: ${input.purpose}`,
    outreach: { emailSubject: '', emailBody: '', voicemailScript: '', linkedinMessage: '', bestFirstTouch: 'Email' },
    source: 'Generated' as const,
    activity: [{ id: crypto.randomUUID(), label: isSL ? 'Referral partner identified (mock)' : 'Lead generated (mock)', timestamp: now }],
    // Senior Living fields
    leadType,
    referralType,
    estimatedReferralVolume,
    organizationType: isReferral ? input.niche : undefined,
    contactRole: isSL ? contactRole : undefined,
    sourceChannel: isSL ? 'referral-ecosystem' : 'smb',
    partnerStatus: isSL ? 'Prospect' : undefined,
    territory: isSL ? `${input.city}, ${input.state}` : undefined,
    referralHistory: [],
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
  const leadScore = Math.floor(Math.random() * 25) + 75;
  const isSL = isSeniorLivingNiche(input.niche);
  const isReferral = isReferralSourceNiche(input.niche);
  const now = new Date().toISOString();

  const lead: Lead = {
    id: `${batchId}-${index + 1}`,
    apolloId: person.id ?? null,
    batchId,
    createdAt: now,
    businessName: org.name ?? person.organization_name ?? 'Unknown Company',
    contactName: person.name ?? `${person.first_name ?? ''} ${person.last_name ?? ''}`.trim(),
    contactTitle: person.title ?? (isSL ? getContactRole(input.niche) : ''),
    email: person.email ?? '',
    phone,
    website: org.website_url ?? '',
    linkedinUrl: person.linkedin_url ?? '',
    niche: input.niche,
    city: person.city ?? input.city,
    state: person.state ?? input.state,
    summary: `${org.name ?? 'This organization'} is a ${input.niche.toLowerCase()} ${isSL ? 'referral source' : 'provider'} serving ${person.city ?? input.city}. ${person.headline ?? ''}`.trim(),
    painPoints,
    personalizationHook: randomFrom(isSL ? referralHooks : standardHooks),
    leadScore,
    referralInfluenceScore: isSL ? inferReferralInfluenceScore(input.niche) : undefined,
    status: getInitialStatus(leadScore, isSL, isReferral),
    notes: `Offer context: ${input.purpose}`,
    outreach: { emailSubject: '', emailBody: '', voicemailScript: '', linkedinMessage: '', bestFirstTouch: 'Email' },
    source: 'Apollo' as const,
    activity: [{ id: crypto.randomUUID(), label: isSL ? 'Referral partner imported from Apollo' : 'Lead imported from Apollo', timestamp: now }],
    leadType: isSL ? inferLeadType(input.niche) : 'Standard',
    referralType: isReferral ? inferReferralType(input.niche) : undefined,
    estimatedReferralVolume: isReferral ? inferEstimatedReferralVolume(input.niche) : undefined,
    organizationType: isReferral ? input.niche : undefined,
    contactRole: isSL ? (person.title ?? getContactRole(input.niche)) : undefined,
    sourceChannel: isSL ? 'referral-ecosystem' : 'smb',
    partnerStatus: isSL ? 'Prospect' : undefined,
    territory: isSL ? `${person.city ?? input.city}, ${person.state ?? input.state}` : undefined,
    referralHistory: [],
  };
  lead.outreach = buildOutreach(lead, input.purpose);
  return lead;
}

// ─── Apollo search call (client → /api/apollo proxy) ─────────────────────────

async function fetchFromApollo(input: LeadSearchInput, batchId: string): Promise<Lead[] | null> {
  try {
    const location = `${input.city}, ${input.state}, United States`;
    const isSL = isSeniorLivingNiche(input.niche);

    const personTitles = isSL
      ? ['Discharge Planner', 'Case Manager', 'Social Worker', 'Care Coordinator', 'Administrator',
         'Executive Director', 'Director of Marketing', 'Elder Law Attorney', 'Financial Advisor',
         'Community Relations Director', 'Placement Specialist', 'Geriatric Care Manager']
      : ['Owner', 'CEO', 'President', 'General Manager', 'Operations Manager', 'Founder'];

    const payload = {
      q_keywords: input.niche,
      person_titles: personTitles,
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

    if (res.status === 501) return null;
    if (res.status === 402) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sparkline:apollo-plan-required'));
      }
      return null;
    }
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

  const count = Math.min(Math.max(input.count ?? 10, 5), 25);
  const leads = Array.from({ length: count }, (_, i) => mockLead(input, batchId, i));
  return { leads, source: 'mock' };
}

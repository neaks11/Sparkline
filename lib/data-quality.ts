import { DataQualityProfile, Lead } from '@/lib/types';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneDigitsRegex = /^\d{10,15}$/;

function normalizeDigits(input: string): string {
  return input.replace(/\D/g, '');
}

function normalizeWebsite(input: string): string {
  if (!input.trim()) return '';
  if (input.startsWith('http://') || input.startsWith('https://')) return input;
  return `https://${input}`;
}

export function verifyContactFields(lead: Lead): Pick<DataQualityProfile, 'emailValid' | 'phoneValid' | 'websiteValid'> {
  const emailValid = emailRegex.test(lead.email.trim().toLowerCase());
  const phoneValid = phoneDigitsRegex.test(normalizeDigits(lead.phone));
  const websiteValid = /^https?:\/\/.+\..+/.test(normalizeWebsite(lead.website));
  return { emailValid, phoneValid, websiteValid };
}

function computeCategoryConfidence(lead: Lead): number {
  const score = [lead.niche, lead.summary, lead.personalizationHook].filter((value) => value.trim().length > 0).length;
  return score === 3 ? 90 : score === 2 ? 75 : 55;
}

export function computeDataConfidence(lead: Lead): DataQualityProfile {
  const checks = verifyContactFields(lead);
  const completeness = [lead.email, lead.phone, lead.website, lead.city, lead.state, lead.contactTitle].filter((value) => value.trim().length > 0).length;
  const completenessScore = Math.round((completeness / 6) * 100);
  const validityScore = Math.round(((checks.emailValid ? 1 : 0) + (checks.phoneValid ? 1 : 0) + (checks.websiteValid ? 1 : 0)) / 3 * 100);
  const categoryConfidence = computeCategoryConfidence(lead);
  const confidenceScore = Math.round(completenessScore * 0.4 + validityScore * 0.4 + categoryConfidence * 0.2);

  return {
    confidenceScore,
    emailValid: checks.emailValid,
    phoneValid: checks.phoneValid,
    websiteValid: checks.websiteValid,
    categoryConfidence,
    enrichedAt: new Date().toISOString(),
  };
}

export function enrichLead(lead: Lead): Lead {
  const website = normalizeWebsite(lead.website || `${lead.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`);
  const linkedinUrl = lead.linkedinUrl || `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(lead.businessName)}`;
  const summary = lead.summary || `${lead.businessName} is a ${lead.niche} business serving ${lead.city}, ${lead.state}.`;

  const enriched = {
    ...lead,
    website,
    linkedinUrl,
    summary,
  };

  return {
    ...enriched,
    dataQuality: computeDataConfidence(enriched),
  };
}

export function enrichLeads(leads: Lead[]): Lead[] {
  return leads.map(enrichLead);
}

function duplicateKey(lead: Lead): string {
  return `${lead.businessName.trim().toLowerCase()}|${lead.city.trim().toLowerCase()}|${lead.state.trim().toLowerCase()}`;
}

export function findDuplicateLeadGroups(leads: Lead[]): string[][] {
  const buckets = new Map<string, string[]>();
  leads.forEach((lead) => {
    const key = duplicateKey(lead);
    const list = buckets.get(key) ?? [];
    list.push(lead.id);
    buckets.set(key, list);
  });
  return Array.from(buckets.values()).filter((ids) => ids.length > 1);
}

export function mergeDuplicateGroup(leads: Lead[], ids: string[]): Lead[] {
  const group = leads.filter((lead) => ids.includes(lead.id));
  if (group.length < 2) return leads;

  const primary = [...group].sort((a, b) => b.leadScore - a.leadScore)[0];
  const merged: Lead = enrichLead({
    ...primary,
    painPoints: Array.from(new Set(group.flatMap((lead) => lead.painPoints))).slice(0, 5),
    scoreFactors: Array.from(new Set(group.flatMap((lead) => lead.scoreFactors))),
    activity: [...group.flatMap((lead) => lead.activity)].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    notes: group.map((lead) => lead.notes).filter(Boolean).join('\n').slice(0, 2000),
    createdAt: group.map((lead) => lead.createdAt).sort()[0] ?? primary.createdAt,
  });

  return [merged, ...leads.filter((lead) => !ids.includes(lead.id))];
}

export function mergeAllDuplicates(leads: Lead[]): { mergedLeads: Lead[]; mergedGroups: number } {
  let next = [...leads];
  let mergedGroups = 0;

  while (true) {
    const groups = findDuplicateLeadGroups(next);
    if (!groups.length) break;
    next = mergeDuplicateGroup(next, groups[0]);
    mergedGroups += 1;
  }

  return { mergedLeads: next, mergedGroups };
}

export const NICHE_CATALOG = {
  'Home Services': ['HVAC', 'Landscaping', 'Plumbing', 'Roofing', 'Electrical Services', 'Home Cleaning'],
  Healthcare: ['Med Spas', 'Dental Practices'],
  Professional: ['Legal Services', 'Real Estate Agencies'],
} as const;

export type NicheIndustry = keyof typeof NICHE_CATALOG;

export const INDUSTRY_OPTIONS = Object.keys(NICHE_CATALOG) as NicheIndustry[];

export const NICHE_OPTIONS = Object.values(NICHE_CATALOG).flat() as string[];

export function getNichesForIndustry(industry: NicheIndustry | ''): string[] {
  if (!industry) return [];
  return [...NICHE_CATALOG[industry]];
}

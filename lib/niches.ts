export const STANDARD_NICHES = [
  'Med Spas',
  'HVAC Companies',
  'Landscaping Companies',
  'Dental Practices',
  'Chiropractic Clinics',
  'Home Cleaning Services',
] as const;

export const MED_SPA_NICHE = 'Med Spas';

export function isMedSpaNiche(value: string): boolean {
  return value.trim().toLowerCase() === MED_SPA_NICHE.toLowerCase();
}

export function isStandardNiche(value: string): boolean {
  return STANDARD_NICHES.includes(value as (typeof STANDARD_NICHES)[number]);
}

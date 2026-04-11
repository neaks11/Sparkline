export const NICHE_OPTIONS = [
  // ── Original SMB niches ──────────────────────────────────────────────────
  'HVAC',
  'Med Spas',
  'Landscaping',
  'Plumbing',
  'Roofing',
  'Electrical Services',
  'Dental Practices',
  'Legal Services',
  'Real Estate Agencies',
  'Home Cleaning',
  // ── Senior Living communities ────────────────────────────────────────────
  'Assisted Living',
  'Memory Care',
  'Independent Living',
  'Senior Care Communities',
  // ── Senior Living referral sources ───────────────────────────────────────
  'Hospital / Discharge Planning',
  'Skilled Nursing Facility',
  'Rehab Centers',
  'Elder Law Attorneys',
  'Home Care Agencies',
  'Senior Placement Agencies',
  'Geriatric Care Managers',
  'Financial Advisors',
  'Churches / Community Organizations',
] as const;

export type NicheOption = (typeof NICHE_OPTIONS)[number];

/** Returns true if the niche is part of the senior living ecosystem */
export function isSeniorLivingNiche(niche: string): boolean {
  const sl = [
    'assisted living', 'memory care', 'independent living', 'senior care',
    'hospital', 'discharge', 'skilled nursing', 'rehab center', 'elder law',
    'home care', 'placement agenc', 'geriatric', 'senior placement',
    'churches', 'community organ',
  ];
  const n = niche.toLowerCase();
  return sl.some((k) => n.includes(k));
}

/** Returns true if the niche is a referral source (not a community itself) */
export function isReferralSourceNiche(niche: string): boolean {
  const sources = [
    'hospital', 'discharge', 'skilled nursing', 'rehab center', 'elder law',
    'home care', 'placement agenc', 'geriatric', 'financial advisor',
    'churches', 'community organ',
  ];
  const n = niche.toLowerCase();
  return sources.some((k) => n.includes(k));
}

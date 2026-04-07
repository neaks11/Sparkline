import { Lead, LeadStatus } from '@/lib/types';

function parseCsvRows(csv: string): string[][] {
  return csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(',').map((cell) => cell.trim()));
}

export function parseLeadsCsv(csv: string): Lead[] {
  const rows = parseCsvRows(csv);
  if (rows.length < 2) return [];
  const header = rows[0];
  const idx = (key: string) => header.findIndex((item) => item.toLowerCase() === key.toLowerCase());
  const now = new Date().toISOString();
  const batchId = `imported-${Date.now()}`;

  return rows.slice(1).map((row, index) => {
    const businessName = row[idx('businessName')] || `Imported Lead ${index + 1}`;
    const contactName = row[idx('contactName')] || 'Unknown Contact';
    const email = row[idx('email')] || '';
    const phone = row[idx('phone')] || '';
    const city = row[idx('city')] || '';
    const state = row[idx('state')] || '';
    const niche = row[idx('niche')] || 'General';
    const status = (row[idx('status')] as LeadStatus) || 'New';

    const lead: Lead = {
      id: `import-${Date.now()}-${index + 1}`,
      apolloId: null,
      batchId,
      businessName,
      contactName,
      contactTitle: 'Owner',
      email,
      phone,
      website: '',
      linkedinUrl: '',
      niche,
      city,
      state,
      summary: `Imported lead for ${businessName}`,
      painPoints: [],
      personalizationHook: 'Imported from CSV',
      leadScore: 70,
      scoreFactors: ['Imported data'],
      status,
      source: 'CSV Import',
      followUpDate: null,
      createdAt: now,
      notes: '',
      outreach: {
        emailSubject: '',
        emailBody: '',
        voicemailScript: '',
        linkedinMessage: '',
        bestFirstTouch: 'Email',
      },
      activity: [{ id: crypto.randomUUID(), label: 'Imported from CSV', timestamp: now }],
    };
    return lead;
  });
}

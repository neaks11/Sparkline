import { Lead } from '@/lib/types';

function downloadFile(filename: string, content: string, type = 'text/plain'): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportLeadsCsv(leads: Lead[]): void {
  const headers = ['businessName', 'contactName', 'contactTitle', 'email', 'phone', 'website', 'linkedinUrl', 'niche', 'city', 'state', 'leadScore', 'status'];
  const rows = leads.map((lead) => headers.map((header) => {
    const value = String(lead[header as keyof Lead] ?? '');
    return `"${value.replaceAll('"', '""')}"`;
  }).join(','));

  const csv = `${headers.join(',')}\n${rows.join('\n')}`;
  downloadFile('sparkline-leads.csv', csv, 'text/csv');
}

export function exportLeadOutreach(lead: Lead, format: 'txt' | 'json'): void {
  if (format === 'json') {
    downloadFile(`${lead.businessName}-outreach.json`, JSON.stringify(lead.outreach, null, 2), 'application/json');
    return;
  }

  const txt = `Business: ${lead.businessName}\nContact: ${lead.contactName}\n\nSubject: ${lead.outreach.emailSubject}\n\n${lead.outreach.emailBody}\n\nVoicemail:\n${lead.outreach.voicemailScript}\n\nLinkedIn:\n${lead.outreach.linkedinMessage}`;
  downloadFile(`${lead.businessName}-outreach.txt`, txt);
}

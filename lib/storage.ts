import { Lead } from '@/lib/types';

const STORAGE_KEY = 'sparkline_leads';

export function saveLeads(leads: Lead[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

export function loadLeads(): Lead[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as Lead[];
  } catch {
    return [];
  }
}

export function loadLeadById(id: string): Lead | null {
  return loadLeads().find((lead) => lead.id === id) ?? null;
}

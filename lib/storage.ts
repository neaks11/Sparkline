import { Account, ActivityRecord, FollowUpTask, Lead, UserProfile } from '@/lib/types';

const STORAGE_KEY = 'sparkline_leads';
const ACCOUNTS_KEY = 'sparkline_accounts';
const ACTIVITIES_KEY = 'sparkline_activities';
const TASKS_KEY = 'sparkline_tasks';
const PROFILE_KEY = 'sparkline_profile';
const SESSIONS_KEY = 'sparkline_sessions';
const GOAL_KEY = 'sparkline_goal';

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveLeads(leads: Lead[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

export function appendLeads(next: Lead[]): Lead[] {
  const merged = [...loadLeads(), ...next];
  saveLeads(merged);
  return merged;
}

export function loadLeads(): Lead[] {
  const leads = readJson<Lead[]>(STORAGE_KEY, []);
  return leads.map((lead) => ({
    ...lead,
    scoreFactors: lead.scoreFactors ?? ['No factors yet'],
    source: lead.source ?? 'Generated',
    followUpDate: lead.followUpDate ?? null,
    createdAt: lead.createdAt ?? new Date().toISOString(),
  }));
}

export function loadLeadById(id: string): Lead | null {
  return loadLeads().find((lead) => lead.id === id) ?? null;
}

export function saveAccounts(accounts: Account[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function loadAccounts(): Account[] {
  return readJson<Account[]>(ACCOUNTS_KEY, []);
}

export function saveActivities(activities: ActivityRecord[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities));
}

export function loadActivities(): ActivityRecord[] {
  return readJson<ActivityRecord[]>(ACTIVITIES_KEY, []);
}

export function saveTasks(tasks: FollowUpTask[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function loadTasks(): FollowUpTask[] {
  return readJson<FollowUpTask[]>(TASKS_KEY, []);
}

export function saveProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadProfile(): UserProfile | null {
  return readJson<UserProfile | null>(PROFILE_KEY, null);
}

export interface SearchSession {
  id: string;
  createdAt: string;
  input: {
    niche: string;
    city: string;
    state: string;
    purpose: string;
    tone: 'Direct' | 'Friendly' | 'Formal';
  };
  duplicateCount?: number;
}

export function loadSessions(): SearchSession[] {
  return readJson<SearchSession[]>(SESSIONS_KEY, []);
}

export function saveSessions(sessions: SearchSession[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function appendSession(session: SearchSession): SearchSession[] {
  const next = [session, ...loadSessions()].slice(0, 50);
  saveSessions(next);
  return next;
}

export interface MonthlyGoal {
  monthly: number;
}

export function loadGoal(): MonthlyGoal {
  return readJson<MonthlyGoal>(GOAL_KEY, { monthly: 25 });
}

export function saveGoal(goal: MonthlyGoal): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(GOAL_KEY, JSON.stringify(goal));
}

export function exportBackup(): void {
  if (typeof window === 'undefined') return;
  const payload = {
    leads: loadLeads(),
    sessions: loadSessions(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `sparkline-backup-${Date.now()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function importBackup(data: { leads?: Lead[]; sessions?: SearchSession[] }): void {
  const existingLeads = loadLeads();
  const incomingLeads = data.leads ?? [];
  const dedupedLeads = [...existingLeads, ...incomingLeads.filter((lead) => !existingLeads.find((existing) => existing.id === lead.id))];
  saveLeads(dedupedLeads);

  if (data.sessions) {
    const existingSessions = loadSessions();
    const dedupedSessions = [...existingSessions];
    data.sessions.forEach((session) => {
      if (!dedupedSessions.find((existing) => existing.id === session.id)) {
        dedupedSessions.push(session);
      }
    });
    saveSessions(dedupedSessions.slice(-100).reverse());
  }
}

import { Account, ActivityRecord, FollowUpTask, Lead, UserProfile } from '@/lib/types';

const STORAGE_KEY = 'sparkline_leads';
const ACCOUNTS_KEY = 'sparkline_accounts';
const ACTIVITIES_KEY = 'sparkline_activities';
const TASKS_KEY = 'sparkline_tasks';
const PROFILE_KEY = 'sparkline_profile';

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

export function loadLeads(): Lead[] {
  return readJson<Lead[]>(STORAGE_KEY, []);
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

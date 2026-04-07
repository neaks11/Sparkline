'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { loadAccounts, loadActivities, loadTasks } from '@/lib/storage';
import { Account } from '@/lib/types';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const loaded = loadAccounts();
    const activities = loadActivities();
    const tasks = loadTasks();

    const decorated = loaded.map((account) => {
      const lastActivity = activities
        .filter((activity) => activity.accountId === account.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      const nextTask = tasks
        .filter((task) => task.accountId === account.id && task.status === 'Open')
        .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())[0];

      return {
        ...account,
        lastActivityType: lastActivity?.type ?? account.lastActivityType,
        lastActivityAt: lastActivity?.timestamp ?? account.lastActivityAt,
        nextFollowUpAt: nextTask?.dueAt ?? account.nextFollowUpAt,
      };
    });

    setAccounts(decorated);
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return accounts.filter((account) => [account.businessName, account.primaryContact, account.status, account.city].join(' ').toLowerCase().includes(normalized));
  }, [accounts, query]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-4 px-4 py-8 md:px-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Accounts</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">Track companies you’re actively working and what follow-up is next.</p>
      </header>

      <div className="card p-4">
        <input className="field" onChange={(event) => setQuery(event.target.value)} placeholder="Search by company, contact, city, status..." value={query} />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-100 text-left dark:bg-slate-800">
              <tr>
                {['Account', 'Website', 'Last Follow-up', 'Last Activity', 'Next Follow-up', 'Status', 'Actions'].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    {accounts.length === 0
                      ? 'No accounts yet — generate leads on the dashboard to populate this list.'
                      : 'No accounts match your search.'}
                  </td>
                </tr>
              )}
              {filtered.map((account) => (
                <tr key={account.id} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-4 py-3">
                    <p className="font-medium">{account.businessName}</p>
                    <p className="text-xs text-slate-500">{account.primaryContact}</p>
                  </td>
                  <td className="px-4 py-3">
                    <a className="text-brand-600" href={account.website} rel="noreferrer" target="_blank">{account.website.replace('https://', '')}</a>
                  </td>
                  <td className="px-4 py-3">{account.lastActivityType ?? '—'}</td>
                  <td className="px-4 py-3">{account.lastActivityAt ? new Date(account.lastActivityAt).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3">{account.nextFollowUpAt ? new Date(account.nextFollowUpAt).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">{account.status}</td>
                  <td className="px-4 py-3">
                    <Link className="btn-secondary" href={`/accounts/${account.id}`}>Open Account</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

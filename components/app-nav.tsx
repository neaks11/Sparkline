'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  {
    section: 'WORKSPACE',
    items: [
      { label: 'Home', href: '/' },
      { label: 'Accounts', href: '/accounts' },
      { label: 'Activities', href: '/activities' },
      { label: 'Activity Feed', href: '/activity' },
    ],
  },
  {
    section: 'SETTINGS',
    items: [
      { label: 'Niche Settings', href: '/settings' },
      { label: 'Profile', href: '/settings/profile' },
    ],
  },
];

interface AppNavProps {
  mode?: 'sidebar' | 'topbar';
}

export function AppNav({ mode = 'sidebar' }: AppNavProps) {
  const pathname = usePathname();

  if (mode === 'topbar') {
    return (
      <div className="flex gap-2 overflow-x-auto">
        {tabs.flatMap((group) => group.items).map((tab) => {
          const active = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.href}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${active ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'}`}
              href={tab.href}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <nav className="h-full w-full bg-slate-950 text-slate-100">
      <div className="sticky top-0 h-screen overflow-y-auto px-4 py-6">
        <Link className="mb-8 block" href="/">
          <p className="text-3xl font-extrabold tracking-tight">
            <span className="brand-gradient-text">Sparkline</span>
          </p>
          <p className="text-xs uppercase tracking-wide text-slate-400">Performance Workspace</p>
        </Link>

        {tabs.map((group) => (
          <div key={group.section} className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{group.section}</p>
            <div className="space-y-1">
              {group.items.map((tab) => {
                const active = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));
                return (
                  <Link
                    key={tab.href}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${active ? 'bg-brand-500 text-white' : 'text-slate-200 hover:bg-slate-800'}`}
                    href={tab.href}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs text-slate-400">
          <p className="font-semibold text-slate-200">Tip</p>
          <p className="mt-1">Use ⌘K / Ctrl+K for global lead search.</p>
        </div>
      </div>
    </nav>
  );
}

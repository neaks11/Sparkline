'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  {
    section: 'WORKSPACE',
    items: [
      { label: 'Dashboard', href: '/', icon: '⚡' },
      { label: 'Accounts', href: '/accounts', icon: '🏢' },
      { label: 'Activities', href: '/activities', icon: '📋' },
      { label: 'Activity Feed', href: '/activity', icon: '📡' },
    ],
  },
  {
    section: 'SETTINGS',
    items: [
      { label: 'My Profile', href: '/settings/profile', icon: '👤' },
      { label: 'Niche Settings', href: '/settings', icon: '⚙️' },
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
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? 'bg-brand-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
              }`}
              href={tab.href}
            >
              <span className="mr-1.5">{tab.icon}</span>
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
        {/* Logo */}
        <Link className="mb-8 block" href="/">
          <p className="text-3xl font-extrabold tracking-tight">
            <span className="brand-gradient-text">Sparkline</span>
          </p>
          <p className="text-xs uppercase tracking-wide text-slate-400">Performance Workspace</p>
        </Link>

        {/* Nav sections */}
        {tabs.map((group) => (
          <div key={group.section} className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {group.section}
            </p>
            <div className="space-y-0.5">
              {group.items.map((tab) => {
                const active =
                  pathname === tab.href ||
                  (tab.href !== '/' && pathname.startsWith(tab.href));
                return (
                  <Link
                    key={tab.href}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                    href={tab.href}
                  >
                    <span className="text-base leading-none">{tab.icon}</span>
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Tip card */}
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs text-slate-400">
          <p className="font-semibold text-slate-200">⌘ Quick Search</p>
          <p className="mt-1">Press ⌘K / Ctrl+K to search across all leads instantly.</p>
        </div>

        {/* Chat hint */}
        <div className="mt-3 rounded-xl border border-purple-900/50 bg-purple-950/30 p-3 text-xs text-purple-300">
          <p className="font-semibold text-purple-200">💬 AI Assistant</p>
          <p className="mt-1">Click the chat bubble (bottom-right) to find leads by conversation.</p>
        </div>
      </div>
    </nav>
  );
}

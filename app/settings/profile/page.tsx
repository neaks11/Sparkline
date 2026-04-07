'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { NICHE_OPTIONS } from '@/lib/niches';
import { loadProfile, saveProfile } from '@/lib/storage';
import { UserProfile } from '@/lib/types';

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
];

const US_TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu',
];

const SAMPLE_CITIES = [
  { city: 'Chicago', state: 'IL' }, { city: 'New York', state: 'NY' },
  { city: 'Los Angeles', state: 'CA' }, { city: 'Houston', state: 'TX' },
  { city: 'Phoenix', state: 'AZ' }, { city: 'Philadelphia', state: 'PA' },
  { city: 'Atlanta', state: 'GA' }, { city: 'Miami', state: 'FL' },
];

function blankProfile(): UserProfile {
  return {
    id: crypto.randomUUID(),
    fullName: '',
    email: '',
    companyName: '',
    role: '',
    productService: '',
    elevatorPitch: '',
    targetNiches: [],
    targetCities: [],
    defaultTone: 'Friendly',
    monthlyLeadGoal: 25,
    timezone: 'America/Chicago',
    avatarColor: AVATAR_COLORS[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function profileCompletion(profile: UserProfile): number {
  const fields = [
    profile.fullName,
    profile.email,
    profile.companyName,
    profile.role,
    profile.productService,
    profile.elevatorPitch,
    profile.targetNiches.length > 0 ? 'x' : '',
    profile.targetCities.length > 0 ? 'x' : '',
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(blankProfile());
  const [saved, setSaved] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [stateInput, setStateInput] = useState('');
  const [apolloKeySet, setApolloKeySet] = useState(false);
  const [apolloPlanRequired, setApolloPlanRequired] = useState(false);

  useEffect(() => {
    const existing = loadProfile();
    if (existing) setProfile(existing);
    // Check if Apollo key configured (via ping to API)
    fetch('/api/apollo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ per_page: 1, q_keywords: 'test' }) })
      .then((r) => {
        if (r.status === 501) { setApolloKeySet(false); setApolloPlanRequired(false); }
        else if (r.status === 402) { setApolloKeySet(true); setApolloPlanRequired(true); }
        else { setApolloKeySet(true); setApolloPlanRequired(false); }
      })
      .catch(() => setApolloKeySet(false));
  }, []);

  const update = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value, updatedAt: new Date().toISOString() }));
  };

  const save = () => {
    saveProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleNiche = (niche: string) => {
    const next = profile.targetNiches.includes(niche)
      ? profile.targetNiches.filter((n) => n !== niche)
      : [...profile.targetNiches, niche];
    update('targetNiches', next);
  };

  const addCity = () => {
    if (!cityInput.trim() || !stateInput.trim()) return;
    const entry = { city: cityInput.trim(), state: stateInput.trim().toUpperCase().slice(0, 2) };
    if (profile.targetCities.some((c) => c.city === entry.city && c.state === entry.state)) return;
    update('targetCities', [...profile.targetCities, entry]);
    setCityInput('');
    setStateInput('');
  };

  const removeCity = (idx: number) => {
    update('targetCities', profile.targetCities.filter((_, i) => i !== idx));
  };

  const pct = profileCompletion(profile);

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl space-y-6 px-4 py-8 md:px-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Powers AI-personalized outreach and smarter lead suggestions.
          </p>
        </div>
        <Link className="btn-secondary text-sm" href="/">← Back</Link>
      </header>

      {/* Completion bar */}
      <div className="card p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Profile Completion</span>
          <span className={pct === 100 ? 'text-emerald-600 font-semibold' : 'text-slate-500'}>{pct}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: pct === 100 ? '#10b981' : '#6366f1' }}
          />
        </div>
        {pct < 100 && (
          <p className="mt-2 text-xs text-slate-500">
            Complete your profile so the AI assistant can generate hyper-personalized outreach.
          </p>
        )}
      </div>

      {/* Avatar + Identity */}
      <div className="card p-6 space-y-5">
        <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Identity</h2>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white shadow"
            style={{ background: profile.avatarColor }}
          >
            {getInitials(profile.fullName) || '?'}
          </div>
          <div className="flex flex-wrap gap-2">
            {AVATAR_COLORS.map((color) => (
              <button
                key={color}
                className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  background: color,
                  borderColor: profile.avatarColor === color ? '#fff' : 'transparent',
                  boxShadow: profile.avatarColor === color ? '0 0 0 2px ' + color : 'none',
                }}
                onClick={() => update('avatarColor', color)}
                type="button"
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Full Name *</label>
            <input
              className="field"
              placeholder="Neaks Johnson"
              value={profile.fullName}
              onChange={(e) => update('fullName', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email *</label>
            <input
              className="field"
              type="email"
              placeholder="you@company.com"
              value={profile.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Company Name *</label>
            <input
              className="field"
              placeholder="A5 Asset Management"
              value={profile.companyName}
              onChange={(e) => update('companyName', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Your Role *</label>
            <input
              className="field"
              placeholder="Founder, CEO, Sales Rep..."
              value={profile.role}
              onChange={(e) => update('role', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Timezone</label>
            <select className="field" value={profile.timezone} onChange={(e) => update('timezone', e.target.value)}>
              {US_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz.replace('America/', '').replace('Pacific/', '').replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Monthly Lead Goal</label>
            <input
              className="field"
              type="number"
              min={1}
              max={500}
              value={profile.monthlyLeadGoal}
              onChange={(e) => update('monthlyLeadGoal', Math.max(1, Number(e.target.value)))}
            />
          </div>
        </div>
      </div>

      {/* What You Sell */}
      <div className="card p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">What You Sell</h2>
        <div>
          <label className="mb-1 block text-sm font-medium">Product / Service *</label>
          <input
            className="field"
            placeholder="e.g. AI chat widget setup that books appointments automatically"
            value={profile.productService}
            onChange={(e) => update('productService', e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-400">
            This pre-fills the &quot;Purpose&quot; field on every search — so you never retype it.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Elevator Pitch *</label>
          <textarea
            className="field min-h-[80px]"
            placeholder="We help HVAC companies capture leads from missed calls using AI. Most clients see 30% more booked jobs in 60 days..."
            value={profile.elevatorPitch}
            onChange={(e) => update('elevatorPitch', e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-400">
            Used in outreach templates and AI chat suggestions.
          </p>
        </div>
      </div>

      {/* Target Niches */}
      <div className="card p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Target Niches *</h2>
        <p className="text-xs text-slate-500">Select all industries you target. The AI assistant will suggest these first.</p>
        <div className="flex flex-wrap gap-2">
          {NICHE_OPTIONS.map((niche) => {
            const active = profile.targetNiches.includes(niche);
            return (
              <button
                key={niche}
                type="button"
                onClick={() => toggleNiche(niche)}
                className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition-all ${
                  active
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {active && <span className="mr-1">✓</span>}
                {niche}
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Cities */}
      <div className="card p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Target Cities *</h2>
        <p className="text-xs text-slate-500">Markets you focus on. The AI assistant uses these to suggest search locations.</p>

        {/* Quick add from common cities */}
        <div className="flex flex-wrap gap-2">
          {SAMPLE_CITIES.map((c) => {
            const already = profile.targetCities.some((x) => x.city === c.city && x.state === c.state);
            return (
              <button
                key={c.city}
                type="button"
                disabled={already}
                onClick={() => update('targetCities', [...profile.targetCities, c])}
                className={`rounded-lg border px-2.5 py-1 text-xs transition ${
                  already ? 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-700 dark:bg-emerald-900/20' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800'
                }`}
              >
                {already ? '✓ ' : '+ '}{c.city}, {c.state}
              </button>
            );
          })}
        </div>

        {/* Custom city input */}
        <div className="flex gap-2">
          <input
            className="field"
            placeholder="City"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCity()}
          />
          <input
            className="field max-w-[80px]"
            placeholder="State"
            maxLength={2}
            value={stateInput}
            onChange={(e) => setStateInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && addCity()}
          />
          <button className="btn-secondary whitespace-nowrap" type="button" onClick={addCity}>Add</button>
        </div>

        {profile.targetCities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profile.targetCities.map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium dark:border-slate-700 dark:bg-slate-800"
              >
                {c.city}, {c.state}
                <button
                  type="button"
                  onClick={() => removeCity(i)}
                  className="ml-1 text-slate-400 hover:text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Outreach Preferences */}
      <div className="card p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Outreach Preferences</h2>
        <div>
          <label className="mb-2 block text-sm font-medium">Default Tone</label>
          <div className="flex gap-2">
            {(['Direct', 'Friendly', 'Formal'] as const).map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() => update('defaultTone', tone)}
                className={`btn-secondary ${profile.defaultTone === tone ? '!border-brand-500 !text-brand-600' : ''}`}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div className="card p-6 space-y-3">
        <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Integrations</h2>
        <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <div>
            <p className="text-sm font-medium">Apollo.io</p>
            <p className="text-xs text-slate-500">Real contact data for live lead generation</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
            apolloKeySet && !apolloPlanRequired
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
              : apolloPlanRequired
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
          }`}>
            {apolloKeySet && !apolloPlanRequired ? '🟢 Connected' : apolloPlanRequired ? '🟡 Key valid — upgrade plan' : '⚪ Not configured'}
          </span>
        </div>
        {!apolloKeySet && (
          <p className="text-xs text-slate-400">
            Add <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">APOLLO_API_KEY=your_key</code> to{' '}
            <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">~/Sparkline/.env.local</code> and restart the server.
          </p>
        )}
        {apolloPlanRequired && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Your Apollo key is connected but people search requires a paid plan.{' '}
            <a href="https://app.apollo.io/#/settings/plans/upgrade" target="_blank" rel="noreferrer" className="underline">
              Upgrade at app.apollo.io →
            </a>
          </p>
        )}
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 pb-8">
        <button className="btn-primary" onClick={save} type="button">
          Save Profile
        </button>
        {saved && (
          <span className="animate-pulse text-sm font-medium text-emerald-600 dark:text-emerald-400">
            ✓ Saved!
          </span>
        )}
      </div>
    </main>
  );
}

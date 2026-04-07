'use client';

import { FormEvent, useEffect, useState } from 'react';
import { loadProfile, saveProfile } from '@/lib/storage';
import { UserProfile } from '@/lib/types';

const defaultProfile: UserProfile = {
  id: 'local-user',
  fullName: '',
  email: '',
  companyName: '',
  productService: '',
  outreachGoal: '',
  timezone: 'America/Chicago',
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existing = loadProfile();
    if (existing) setProfile(existing);
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    saveProfile(profile);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl space-y-4 px-4 py-8 md:px-6">
      <header>
        <h1 className="text-3xl font-bold">Profile & Settings</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">Your personal and offer defaults used across outreach workflows.</p>
      </header>

      <form className="card grid gap-4 p-6" onSubmit={submit}>
        <div>
          <label className="mb-1 block text-sm font-medium">Full Name</label>
          <input className="field" onChange={(event) => setProfile((prev) => ({ ...prev, fullName: event.target.value }))} value={profile.fullName} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input className="field" onChange={(event) => setProfile((prev) => ({ ...prev, email: event.target.value }))} value={profile.email} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Company Name</label>
          <input className="field" onChange={(event) => setProfile((prev) => ({ ...prev, companyName: event.target.value }))} value={profile.companyName} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Product / Service You Sell</label>
          <textarea className="field min-h-24" onChange={(event) => setProfile((prev) => ({ ...prev, productService: event.target.value }))} value={profile.productService} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Primary Outreach Goal</label>
          <textarea className="field min-h-24" onChange={(event) => setProfile((prev) => ({ ...prev, outreachGoal: event.target.value }))} value={profile.outreachGoal} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Timezone</label>
          <input className="field" onChange={(event) => setProfile((prev) => ({ ...prev, timezone: event.target.value }))} value={profile.timezone} />
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-primary" type="submit">Save Profile</button>
          {saved && <span className="text-sm text-emerald-600 dark:text-emerald-300">Saved</span>}
        </div>
      </form>
    </main>
  );
}

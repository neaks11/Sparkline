# Sparkline

Sparkline is a portfolio-ready MVP for local lead generation and outreach prep, now updated with a **settings-driven niche system** and a dedicated **Med Spa Only Mode**.

## What it does

- Generate realistic local leads from niche + city + state searches
- Organize and score leads in a sortable dashboard table
- Open each lead in a detail workspace with context + outreach drafts
- Auto-generate Email, Voicemail Drop, and LinkedIn outreach per lead
- Edit, regenerate, copy, and export outreach assets
- Export lead lists to CSV
- Manage niche availability through Settings with local persistence

## Med Spa focus update

Sparkline now supports a verticalized workflow for med spa prospecting while preserving multi-niche architecture:

- Dedicated `Settings` page with **Niche Management**
- Toggle active niches on/off
- Add/remove custom niches
- Set default niche
- Enable **Med Spa Only Mode** (`activeNiches = ["Med Spas"]`)
- Reset settings to standard defaults
- Search form and dashboard filters now respect **active niches** from settings
- Med spa-aware copy and offer guidance (consultation booking, front desk automation, missed-call text-back, review reactivation)
- Med spa-specific lead signals and scoring heuristics for more realistic mock data

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- localStorage for leads + app settings persistence

## Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Key files

- `app/page.tsx` – dashboard, generation flow, filters, CSV export
- `app/settings/page.tsx` – niche management + med spa mode controls
- `app/leads/[id]/page.tsx` – lead detail workspace + outreach editing
- `components/search-form.tsx` – settings-aware search UX
- `lib/settings.ts` – settings defaults/load/save/reset/normalize
- `lib/niches.ts` – standard niche catalog + niche helpers
- `lib/lead-generator.ts` – mock lead generation + med spa scoring signals
- `lib/outreach-generator.ts` – outreach message generation logic

## Future improvements

- Add adapters for real lead sources (Google Places, Yelp, etc.)
- Add saved views / segments per niche and market
- Add quality scoring for outreach variants
- Add CRM export mappings (HubSpot/Salesforce)

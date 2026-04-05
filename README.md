# Sparkline (LeadForge UI)

Sparkline is a portfolio-ready MVP web app for SMB lead generation and outreach prep. It helps solo operators, agency owners, and sales reps quickly generate realistic local business leads, prioritize them, and draft personalized first-touch messaging.

> Subtitle: **Find better leads. Reach out smarter.**

## Why this project exists

Most outbound workflows break down before outreach quality does:
- reps spend too much time collecting lead data
- lead context is scattered
- first-touch copy sounds templated

Sparkline demonstrates a practical internal tool that solves those issues with clean UX, typed data, and extensible generation utilities.

## Core features

- **Lead search form** by niche + city + state (+ optional offer notes)
- **Mock lead generation** (10 realistic leads per query)
- **Sortable/filterable lead table** with status and score
- **Lead detail workspace** with:
  - full profile
  - summary + pain points + personalization hook
  - outreach generation for Email, Voicemail Drop, LinkedIn message
- **Outreach editing tools**
  - inline editing
  - regenerate outreach
  - copy each channel
  - copy all 3 messages
- **Workflow controls**
  - mark lead as contacted
  - notes field
  - activity timeline
  - best-first-touch recommendation
  - hot lead badge for scores >85
- **Export options**
  - all leads to CSV
  - lead outreach to TXT or JSON
- **UI polish**
  - card-based interface
  - responsive layout
  - loading + empty states
  - light/dark mode toggle

## Tech stack

- **Next.js** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Local storage JSON persistence** (no paid API dependency)

## Project structure

```text
app/
  page.tsx                 # dashboard + search + lead table
  leads/[id]/page.tsx      # lead detail + outreach workspace
  globals.css
components/
  search-form.tsx
  leads-table.tsx
  outreach-editor.tsx
  theme-toggle.tsx
lib/
  types.ts                 # typed data model
  lead-generator.ts        # seed/mock lead generation utility
  outreach-generator.ts    # personalized outreach generation utility
  storage.ts               # local persistence helpers
  export.ts                # CSV/TXT/JSON export helpers
```

## Data model

Each lead follows a strongly typed schema with:
- `id`
- `businessName`
- `contactName`
- `contactTitle`
- `email`
- `phone`
- `website`
- `linkedinUrl`
- `niche`
- `city`
- `state`
- `summary`
- `painPoints`
- `personalizationHook`
- `leadScore` (1–100)
- `status` (`New` | `Ready` | `Contacted`)
- `outreach`
  - `emailSubject`
  - `emailBody`
  - `voicemailScript`
  - `linkedinMessage`
  - `bestFirstTouch`

## Local development

### 1) Install dependencies

```bash
npm install
```

### 2) Run dev server

```bash
npm run dev
```

### 3) Open app

Go to [http://localhost:3000](http://localhost:3000)

### 4) Production build (optional)

```bash
npm run build
npm run start
```

## Portfolio framing

This project is intentionally framed as an internal GTM/sales-ops productivity tool and demonstrates:
- product thinking around prospecting workflows
- data modeling and typed architecture
- practical AI-adjacent generation utilities
- exportable outputs for downstream sales motion
- clean UX implementation and extensible design

## Future improvements

- Plug-in adapters for Google Places/Yelp/Clay/Apollo APIs
- Team collaboration + shared workspaces
- Contact cadence sequencing + reminders
- CRM sync (HubSpot, Salesforce)
- Message quality scoring and A/B testing
- Role-based templates by vertical and offer type

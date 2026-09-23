# LogKerja — WorkDiary PWA

Production-oriented personal work diary PWA: local-first, offline-capable, optional AES-GCM vault, AI-assisted reflection, analytics, export, and import integrations.

## What is included

### Sprint 1 — Core PWA
- Next.js App Router static export for Cloudflare Pages
- Installable Android PWA + service worker + offline shell
- IndexedDB via Dexie
- Quick Capture + voice-to-text + 5-second draft autosave
- Timeline, search, date/project/mood filters
- Web Share Target for text/link/image into Quick Capture

### Sprint 2 — Diary system + security
- Onboarding (role, reminder, default template, PIN/biometric)
- Built-in + custom templates
- Entry detail: edit, duplicate, archive, delete, change history
- Attachments
- AES-GCM local vault with PIN-derived wrapping key (PBKDF2-SHA256)
- Optional biometric unlock via WebAuthn PRF when supported
- Idle auto-lock
- Markdown, CSV, JSON, PDF export
- Portable encrypted `.lkbackup` emergency backup/restore
- Daily reminder (best-effort while PWA/runtime is active)
- Streak and automatic local weekly recap

### Sprint 3 — AI + analytics
- Weekly / monthly summary
- Brag document (STAR)
- Diary Q&A
- Problem Pattern Detector
- Weekly Letter to Self
- Review Prep Mode
- Daily reflection prompts
- Whisper Mode: long voice/text -> structured entry draft
- Offline reflection fallback (no model download)
- Analytics: project time, mood trend, heatmap, skill tracker, career timeline
- Mood vs output-proxy correlation with explicit caveat

### Sprint 4 — integrations + polish
- Google Calendar / iCalendar `.ics` import
- Public GitHub activity import
- CSV import (including common Notion-style exports)
- JSON import, Trello `cards[]`, Slack per-channel JSON
- Export hub
- In-app manual
- Light/dark/system theme
- Privacy-first AI server gate

## Architecture

The diary database stays in the user's browser/installed PWA. Cloudflare hosts the static application. AI is optional and uses a Cloudflare Pages Function at `/api/ai`, so the OpenAI API key never exists in the client bundle.

```text
Android PWA / Browser
  ├─ IndexedDB (primary diary)
  ├─ Web Crypto AES-GCM (optional vault)
  ├─ Service Worker / offline cache
  └─ explicit AI request only
          ↓
Cloudflare Pages Function /api/ai
          ↓
OpenAI Responses API
```

Attachments are not sent to AI by this app. The client sends only sanitized text fields for entries in the selected date range.

## Requirements

- Node.js 20.9+ (Node 22 is fine)
- npm
- Cloudflare account for deployment
- OpenAI API key only if online AI features are desired

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

`next dev` is ideal for UI and local IndexedDB work. To test Cloudflare Pages Functions locally, use the full Pages preview flow:

1. Copy `.dev.vars.example` to `.dev.vars` and fill the secrets.
2. Run:

```bash
npm run build
npx wrangler pages dev out
```

Then open the Wrangler local URL (normally `http://localhost:8788`).

## Deploy to Cloudflare Pages

See `CLOUDFLARE_DEPLOY.md` for beginner-friendly steps.

Cloudflare build settings:

```text
Framework preset : Next.js (Static HTML Export)
Build command    : npm run build
Build directory  : out
Root directory   : /
```

The `/functions` directory stays at repository root. Cloudflare Pages detects it as Pages Functions and deploys `/functions/api/ai.ts` as `/api/ai`.

## AI secrets

Set these as Cloudflare server-side secrets/variables:

```text
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.6-luna
AI_ACCESS_TOKEN=<a long random personal token>
```

`AI_ACCESS_TOKEN` is intentionally required by the function. This prevents accidentally deploying a public endpoint that spends your OpenAI credits. Enter the same personal token inside LogKerja Settings on the devices that are allowed to use AI.

Never prefix `OPENAI_API_KEY` with `NEXT_PUBLIC_`.

## Important privacy notes

- Local diary data is not automatically uploaded.
- Enabling PIN migrates existing entry text and attachments into encrypted IndexedDB records.
- Web Share Target content is temporarily held by the service worker until Quick Capture consumes it; it should not be used for highly sensitive incoming attachments while the vault is locked.
- Export Markdown/CSV/JSON/PDF is plaintext by design.
- Emergency `.lkbackup` is encrypted with a separate backup password.
- AI is opt-in per action. The Cloudflare function calls the OpenAI Responses API with `store: false`.

## Reminder limitation

A static PWA cannot guarantee an exact daily push while the browser/app process is fully stopped. LogKerja provides local notifications while its runtime is active. A future commercial build that requires reliable scheduled push should use a Worker with push subscriptions + scheduler/cron.

## Why no WebLLM in this build?

The brief asked not to add heavy libraries without a reason. Shipping a local LLM would substantially increase download/storage/RAM. The offline fallback therefore uses deterministic local analytics and reflection heuristics. WebLLM can later be an optional downloadable capability.

## Scripts

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
npm run check
npm run preview:cf
npm run deploy
```

## Data ownership

Settings includes full local deletion. Integration Hub supports plaintext report exports. Settings also provides encrypted portable backup/restore.


## Additional documentation

- `CLOUDFLARE_DEPLOY.md` — Cloudflare deployment.
- `DEPLOY_WINDOWS.md` — beginner-friendly Windows deployment.
- `MANUAL.md` — usage manual.
- `ARCHITECTURE.md` — technical trade-offs.
- `SECURITY.md` — security model and limitations.
- `DEPENDENCIES.md` — dependency rationale.
- `ROADMAP_STATUS.md` — sprint completion status.
- `MONETIZATION.md` — Free/Pro/Team proposal.
- `EXPERT_IDEAS.md` — next high-value product ideas.
- `VALIDATION.md` — checks completed and the build-environment limitation.

# 4 Sprint Status

## Sprint 1 — Core MVP: COMPLETE
PWA, Dexie schema, Quick Capture, autosave, voice input, Timeline, search/filter, Share Target, offline shell.

## Sprint 2 — Security + diary workflow: COMPLETE
Onboarding, templates, detail/edit/duplicate/archive/delete, history, PIN AES-GCM vault, WebAuthn PRF biometric when supported, auto-lock, exports, encrypted backup/restore, reminders, streak.

## Sprint 3 — AI + analytics: COMPLETE FOR PERSONAL EDITION
Weekly/monthly review, brag document, Q&A, patterns, weekly letter, review prep, daily prompts, Whisper Mode, offline fallback, project/mood/heatmap/skill/career analytics.

## Sprint 4 — Integrations + polish: COMPLETE FOR PERSONAL EDITION
ICS/Calendar, public GitHub, CSV/Notion-style, JSON/Trello/Slack, export hub, themes, in-app manual, Cloudflare Pages Function AI gate.

## Intentionally NOT enabled by default
These were optional in the brief and need a real identity/server model before they should be called production-ready:
- automatic multi-device cloud sync
- Team Mode/shared knowledge base
- guaranteed background scheduled push when app is closed
- private GitHub/Slack/Trello/Notion OAuth connections

For a commercial multi-user edition, build these as a separate server/sync layer with authenticated users, row-level authorization, encrypted sync payloads, conflict resolution, and audit logs. Do not simply upload plaintext IndexedDB rows.

# Dependencies

## Runtime
- `next 16.3.6` — App Router + static export.
- `react 19.2.8`, `react-dom 19.2.8` — UI runtime.
- `dexie ^4.4.6` — IndexedDB schema/query wrapper.
- `dexie-react-hooks ^4.4.0` — reactive local database queries.
- `lucide-react ^0.468.0` — lightweight SVG icons.
- `jspdf ^3.0.2` — client-side PDF export, dynamically imported only when needed.

## Development / deployment
- `typescript ^5.9.2`
- `tailwindcss ^3.4.17`, `postcss`, `autoprefixer`
- `eslint ^9.39.2`, `eslint-config-next 16.3.6`
- `wrangler ^4.0.0` — Cloudflare Pages local preview/deploy.

## Browser/platform APIs used instead of extra libraries
- Web Crypto API — AES-GCM/PBKDF2.
- WebAuthn PRF — optional biometric cryptographic unwrap.
- Web Speech API — voice capture where browser supports it.
- Notifications API — best-effort local reminder.
- Web Share API / Web Share Target — Android share flows.
- Service Worker + Cache API — offline shell/precache.
- IndexedDB — local data ownership.

No charting library is required; analytics visuals use CSS/SVG to keep the PWA smaller.

# Architecture Decisions

## 1. Static Next.js on Cloudflare Pages
The UI and all core CRUD are client-side/local-first. Static export keeps hosting simple and cheap while Pages Functions supply one protected AI endpoint.

Trade-off: reliable scheduled web push, team collaboration, and server-side sync orchestration are better implemented on Cloudflare Workers later.

## 2. IndexedDB + Dexie
IndexedDB can store structured data and Blob attachments and works offline. Dexie provides schema migrations and reactive queries with low application complexity.

## 3. Security model
When PIN vault is enabled:
- A random 256-bit Data Encryption Key (DEK) is generated.
- PIN + random salt -> PBKDF2-SHA256 -> Key Encryption Key.
- The KEK encrypts/wraps the DEK using AES-GCM.
- Diary entry payloads and attachment bytes use the DEK with fresh nonces.
- The raw DEK exists in memory/session storage only while the local session is unlocked.
- Biometric unlock uses WebAuthn PRF when supported to create a second cryptographic wrapping path for the same DEK.

Limitations: browser/XSS compromise while the vault is unlocked can access decrypted data. Encryption-at-rest does not replace device security. CSP is included to reduce attack surface.

## 4. AI privacy boundary
The API key stays in Cloudflare Pages Functions. The UI sends a sanitized subset of selected entries only after explicit user action. Attachments are excluded. The function requires `AI_ACCESS_TOKEN` and uses `store:false` in the OpenAI Responses API request.

## 5. Analytics without chart libraries
Simple SVG/CSS avoids a heavy chart dependency. The mood/output correlation uses count of diary entries per day as an explicit proxy, not a claim of real productivity.

## 6. Offline AI
Instead of bundling a large WebLLM model, LogKerja ships deterministic local summaries, prompts, brag-draft logic and pattern frequency. This keeps install size and memory usage low. Local LLM can later be opt-in/downloadable.

## 7. Integration strategy
Imports are preferred over permanent OAuth connections for the personal edition. Calendar `.ics`, GitHub public events, CSV, Trello/Slack JSON can become local entries without granting continuous account access.

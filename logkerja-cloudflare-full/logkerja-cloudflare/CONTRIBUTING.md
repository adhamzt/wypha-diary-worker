# Contributing

1. Keep core diary features offline-first.
2. Never add an API secret to client-side code or a `NEXT_PUBLIC_*` variable.
3. Do not transmit diary data without an explicit user action/consent surface.
4. Keep migrations backward compatible in `lib/db/db.ts`.
5. Prefer browser/platform APIs and small utilities over heavy dependencies.
6. Before a pull request run `npm run check`.
7. Security changes must include a migration/recovery story and must not silently downgrade encrypted records to plaintext.

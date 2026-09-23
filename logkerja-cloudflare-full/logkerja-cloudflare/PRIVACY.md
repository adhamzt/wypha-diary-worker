# Privacy & Security Notes

- No third-party analytics SDK is included.
- Core diary works offline and stores data in browser IndexedDB.
- PIN vault is optional but recommended during onboarding.
- The OpenAI API key is server-side only.
- AI requests occur only after user action.
- AI payload excludes attachments.
- Plaintext report exports are explicitly initiated by the user.
- Emergency backup is independently password-encrypted.
- Deleting site/browser storage can remove local data; keep encrypted backups.
- Losing both the vault PIN and usable biometric wrapping path can make encrypted local records unrecoverable. There is no hidden recovery key.

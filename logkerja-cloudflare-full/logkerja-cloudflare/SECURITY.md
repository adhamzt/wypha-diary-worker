# Security Notes

- Diary utama berada di IndexedDB perangkat.
- Vault menggunakan data-encryption-key AES-GCM 256-bit.
- PIN diturunkan dengan PBKDF2-SHA256 (310k iterasi) untuk membungkus DEK; PIN tidak disimpan sebagai plaintext.
- Biometric menggunakan WebAuthn PRF hanya bila authenticator/browser mendukung; PIN selalu fallback.
- Session unlock key berada di `sessionStorage`, bukan localStorage permanen, dan dibersihkan saat auto-lock.
- Lampiran ikut dienkripsi ketika vault aktif.
- Emergency backup dienkripsi lagi dengan password backup terpisah.
- `OPENAI_API_KEY` hanya untuk Cloudflare Pages Function, bukan client.
- Teks diary dikirim ke AI hanya setelah tindakan eksplisit pengguna; attachment tidak dikirim.
- Share Target perlu inbox sementara yang tidak mempunyai akses ke vault key; inbox dibersihkan ketika share dikonsumsi. Hindari berbagi data sangat sensitif ke app ketika vault terkunci.

## Threat model yang belum diselesaikan

Enkripsi lokal tidak melindungi data dari malicious script/XSS yang sudah berjalan dalam origin ketika vault sedang terbuka. Karena itu CSP, dependency hygiene, minim third-party script, dan update rutin tetap penting.

Untuk multi-device/team edition, diperlukan auth, server-side authorization, audit log, revocation, encrypted sync protocol, dan conflict handling sebelum disebut production-ready.

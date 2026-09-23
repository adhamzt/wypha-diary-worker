# Manual Ringkas

## Capture harian
Home → Catat Sekarang → isi Aktivitas + Mood → Simpan. Detail lanjutan opsional. Draft autosave tiap 5 detik.

## Template
Quick Capture → dropdown template. Kelola di `/templates/`.

## Edit / history
Timeline → pilih entry. Setiap Simpan perubahan akan membuat snapshot versi sebelumnya.

## Security
Settings → Security → aktifkan PIN. Setelah migrasi selesai, entry dan attachment baru masuk ke encrypted stores. Gunakan tombol Kunci sekarang untuk test auto-lock.

## Backup
Settings → Emergency Backup → password 8+ karakter → download `.lkbackup`. Untuk restore, masukkan password yang sama lalu pilih file.

## AI
1. Konfigurasikan secret di Cloudflare.
2. Masukkan AI_ACCESS_TOKEN yang sama di Settings app.
3. Insights → pilih rentang → tekan generator.
4. Tanpa AI online, fallback lokal dipakai untuk fitur yang sesuai.

## Analytics
Isi `duration`, `skills`, `impact`, dan tandai `achievement` agar dashboard menjadi lebih bermakna.

## Integrations
- Calendar: export `.ics` lalu import.
- GitHub: masukkan username untuk public events.
- CSV: header umum akan dipetakan otomatis.
- Trello: JSON dengan `cards[]`.
- Slack: file JSON per-channel dari export.

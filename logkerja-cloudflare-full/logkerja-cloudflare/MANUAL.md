# Manual Ringkas

## Note bebas (terpisah dari log kerja)
Tekan tab **Note** → **Baru** → beri judul, pilih jenis pekerjaan (atau Umum), lalu tulis teks. Tekan **Simpan** sebelum kembali atau pindah tab. Note tidak dihitung sebagai log kerja, tetapi semua jenis pekerjaan dapat dilihat dan difilter dari satu tab Note.

- **Daftar kegiatan:** Tambah item, lalu sentuh kotak untuk mencentang atau membatalkan. Buka **Riwayat centang** untuk melihat tanggal dan jam setiap perubahan; menghapus item tidak menghapus peristiwa lamanya.
- **Peta pikiran:** Buat ide utama, sentuh `+` pada ide untuk menambah cabang; ubah teks dan warna, geser area peta, atau perbesar/perkecil. Menghapus satu cabang juga menghapus seluruh turunannya. Tekan **Simpan** setelah mengubah peta.
- **Gambar:** Pilih file gambar. **Kanvas:** gambar dengan jari/mouse, lalu **Simpan gambar**. **Rekam audio:** izinkan mikrofon, tekan **Selesai rekam**; rekaman langsung tersimpan sebagai lampiran. Setiap file maksimal 20 MB.
- **Pin**, **Arsipkan**, **Ke Sampah**, dan **Riwayat versi** ada di editor Note. Sampah menyimpan Note 30 hari sejak dihapus, kemudian dibersihkan otomatis saat aplikasi dibuka. Anda dapat memulihkan atau menghapus permanen lebih cepat. Arsip tetap tersimpan tanpa batas waktu.
- **Backup/restore:** Setelan → Emergency Backup → password minimal 8 karakter → **Buat .lkbackup**. Simpan file dan password di tempat aman. File ini memuat log, Note, gambar, rekaman, kanvas, riwayat Note, dan jenis pekerjaan. Restore **mengganti seluruh data lokal** di browser itu dan menonaktifkan PIN vault; buat backup terbaru sebelum restore dan aktifkan PIN lagi bila diperlukan.

Note dan lampirannya disimpan di perangkat/browser yang sedang dipakai. Membuka alamat app pada perangkat atau profil browser lain tidak otomatis menyalin data; gunakan backup/restore untuk memindahkannya. Hindari menghapus data situs/browser bila belum punya backup.

## Capture harian
Home → Catat Sekarang → isi Aktivitas + Mood → Simpan. Detail lanjutan opsional. Draft autosave tiap 5 detik.

## Beberapa jenis pekerjaan dalam satu diary
Pilih **Pekerjaan** di navigasi untuk melihat folder **Global** (semua log) dan folder **Umum**. Tambahkan jenis pekerjaan seperti Administratif, Desainer, atau Rumah lewat kolom nama, pilih warna, lalu tekan **Tambah pekerjaan**. Anda bisa mengganti nama/warna tanpa mengubah log yang sudah ada. Mengarsipkan jenis pekerjaan menyembunyikannya dari pilihan log baru, tetapi catatan lama tetap berada di Global dan dapat dicari lewat folder itu. Aktifkan kembali kapan pun.

Saat mencatat, pilih **Jenis pekerjaan** di bagian atas formulir. **Proyek** di Detail lanjutan tetap opsional dan berada di bawah jenis pekerjaan. Catatan sebelum upgrade serta impor tanpa kategori muncul dalam **Umum**; data lama tidak ditulis ulang. Anda dapat mengubah jenis pekerjaan pada halaman detail catatan.

Timeline memiliki tab Global dan masing-masing pekerjaan, lalu pencarian, tanggal, proyek, dan mood bisa digabung. Analytics dan Insights dapat memilih Global atau satu jenis pekerjaan. Di Import & Export Hub, pilih cakupan sebelum mengunduh laporan. Backup `.lkbackup` membawa daftar jenis pekerjaan beserta ID-nya, sehingga hubungan log tetap utuh saat dipulihkan. CSV/JSON hasil ekspor juga memuat nama jenis pekerjaan untuk diimpor lagi.

## Template
Quick Capture → dropdown template. Kelola di `/templates/`.

## Edit / history
Timeline → pilih entry. Setiap Simpan perubahan akan membuat snapshot versi sebelumnya.

## Security
Settings → Security → aktifkan PIN. Setelah migrasi selesai, entry dan attachment baru masuk ke encrypted stores. Gunakan tombol Kunci sekarang untuk test auto-lock.

Nama dan warna jenis pekerjaan disimpan sebagai metadata lokal yang tidak dienkripsi oleh vault; teks log dan lampirannya tetap mengikuti pengaturan vault. Jangan gunakan nama folder yang rahasia pada perangkat bersama.

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

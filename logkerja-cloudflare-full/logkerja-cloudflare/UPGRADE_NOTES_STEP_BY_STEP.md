# Upgrade LogKerja dengan Note — panduan pemula

Paket `LogKerja-Notes-source.zip` berisi **kode aplikasi**, bukan file backup catatan Anda. Jangan unggah ZIP kode ke tombol **Restore backup** di aplikasi.

## 1. Amankan data lebih dulu

1. Buka aplikasi LogKerja **yang saat ini Anda gunakan**, pada perangkat dan browser yang menyimpan data.
2. Buka **Setelan → Emergency Backup**, buat password backup minimal 8 karakter, lalu tekan **Buat .lkbackup**.
3. Simpan file `.lkbackup` dan passwordnya. Pastikan file selesai terunduh.
4. Catat alamat lengkap aplikasi, misalnya `https://nama.pages.dev`. Usahakan memakai alamat yang **sama** setelah upgrade supaya data lokal pada browser tetap terbaca. Jika alamat/perangkat/profil browser berbeda, pulihkan dari `.lkbackup`.

## 2. Perbarui kode GitHub

Repositori Anda: `https://github.com/adhamzt/wypha-diary-worker`.

1. Unduh `LogKerja-Notes-source.zip` yang disediakan bersama panduan ini dan **Extract All**.
2. Buka salinan lokal repositori `wypha-diary-worker` di komputer Anda. Jika sudah ada di GitHub Desktop, gunakan **Repository → Show in Explorer**.
3. Di dalam salinan repositori, masuk ke `logkerja-cloudflare-full\logkerja-cloudflare`.
4. Salin **seluruh isi** folder hasil ekstrak `LogKerja-Notes-source` ke folder pada langkah 3. Jika Windows meminta konfirmasi, pilih **Replace the files**. Jangan menyalin folder `node_modules`, `.next`, `out`, atau file `.lkbackup` ke GitHub.
5. Buka GitHub Desktop. Periksa daftar perubahan, isi **Summary** dengan `Tambah Note, peta pikiran, dan backup`, lalu tekan **Commit to main** dan **Push origin**. Jika branch produksi Anda bukan `main`, pilih branch yang dipakai Cloudflare.

Jika GitHub Desktop sebelumnya gagal **Clone** karena timeout, instal **Git for Windows** lalu buka PowerShell di folder kerja yang kosong dan coba unduh lebih ringan:

```powershell
git clone --depth 1 https://github.com/adhamzt/wypha-diary-worker.git
```

Setelah berhasil, jalankan langkah 3–5 pada folder hasil clone. Di GitHub Desktop gunakan **File → Add local repository** bila folder itu belum muncul. Jika **Push origin** meminta login, ikuti dialog GitHub di browser. Jangan membagikan password atau token kepada siapa pun.

## 3. Tunggu Cloudflare selesai

1. Jika project Cloudflare Pages Anda terhubung ke GitHub, push ke branch produksi akan memulai build otomatis.
2. Buka Cloudflare → **Workers & Pages** → pilih project LogKerja → **Deployments**. Tunggu status **Success**.
3. Pastikan pengaturan build lama tetap: **Root directory** `logkerja-cloudflare-full/logkerja-cloudflare`, **Build command** `npm run build`, dan **Output directory** `out`.
4. Buka alamat aplikasi yang sama. Tutup dan buka ulang aplikasi terpasang di Android bila tab **Note** belum muncul (cache PWA mungkin sedang berganti versi).

Cloudflare membedakan project yang terhubung GitHub dari unggah langsung. Jangan mengunggah ZIP **source** ini ke fitur drag-and-drop Pages; paket source harus dibangun dahulu, dan project GitHub biasanya memakai alur push di atas. Dokumentasi resmi: [Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/) dan [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/).

## 4. Periksa hasil upgrade

1. Pastikan log kerja lama masih muncul di **Timeline**.
2. Tekan tab **Note → Baru**. Pilih pekerjaan, isi judul dan teks, lalu **Simpan**.
3. Tambah satu item daftar dengan teks panjang; seluruh teks akan turun ke baris berikutnya. Tekan **Simpan**, lalu centang item. Buka **Riwayat centang** untuk melihat jamnya; ikon tempat sampah menghapus satu kejadian, sedangkan **Hapus semua riwayat centang** membersihkan seluruh kejadian pada Note itu.
4. Tambah ide utama di **Peta pikiran**, tambah cabang, lalu **Simpan**.
5. Uji gambar, **Kanvas**, dan **Rekam audio**. Browser akan meminta izin mikrofon; alamat HTTPS diperlukan.
6. Uji **Pin**, **Arsip**, dan **Sampah**. Note di Sampah dapat dipulihkan dalam 30 hari sejak dihapus.
7. Buat backup `.lkbackup` baru setelah beberapa Note dibuat. Simpan di luar browser.

Jika data lama tidak terlihat, **jangan langsung menulis banyak data baru**. Pastikan alamat URL, perangkat, dan profil browser sama. Jika memang berbeda, buka **Setelan → Emergency Backup**, masukkan password backup, dan pilih file `.lkbackup`. Restore **mengganti semua data lokal** pada browser tersebut; buat backup data yang ada di sana dahulu. PIN vault dinonaktifkan sesudah restore, jadi aktifkan lagi bila perlu.

## Cara memakai Note sehari-hari

- **Note** memuat semua pekerjaan dalam satu daftar; gunakan dropdown **Semua pekerjaan** untuk menyaring Administratif, Desainer, Rumah, dan lainnya.
- **Simpan** setelah mengetik atau mengubah peta pikiran. Perubahan checkbox langsung disimpan bersama waktu centangnya. Menambah lampiran juga langsung disimpan.
- **Riwayat versi** menampilkan versi sebelum penyimpanan dan dapat memulihkan isinya.
- **Arsip** menyimpan tanpa batas waktu; **Sampah** dibersihkan otomatis saat aplikasi dibuka setelah 30 hari. Backup yang dibuat sebelum penghapusan masih dapat memuat Note tersebut.
- Data Note disimpan pada browser/perangkat ini. `.lkbackup` terenkripsi adalah cara memindahkannya ke perangkat lain.

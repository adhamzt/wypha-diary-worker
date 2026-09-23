# Ide Pengembangan Bernilai Tinggi

## 1. Evidence Inbox
Sebelum menjadi diary entry, tangkap bukti kerja dari Share Target: screenshot chat, link dokumen, foto, atau teks. User memilih mana yang dipromosikan menjadi entry. Ini mengurangi friksi tanpa mencampur inbox dengan diary permanen.

## 2. Outcome First
Tambahkan tombol cepat **“Ada hasil/dampak”**. Entry dengan impact bisa otomatis masuk kandidat Brag Document. Nilai aplikasi bukan banyaknya catatan, tetapi kemudahan menemukan bukti kontribusi saat dibutuhkan.

## 3. Review Readiness Score — bukan skor performa
Tampilkan kelengkapan *bukti* review: berapa pencapaian punya konteks, tindakan, impact, dan skill. Jangan menilai kualitas karyawan. Tujuannya hanya menunjukkan data apa yang masih kurang untuk menyusun review yang kredibel.

## 4. Problem → System Fix Loop
Ketika problem yang sama muncul berulang, aplikasi membuat “system fix card”: pola, frekuensi, solusi yang pernah dicoba, eksperimen berikutnya, dan tanggal cek ulang. Ini lebih berguna daripada sekadar tag cloud.

## 5. Private/Shareable Split
Setiap entry dapat punya dua lapisan di masa depan: **private reflection** dan **shareable evidence**. AI report hanya memakai lapisan yang user pilih. Sangat penting bila aplikasi nanti dipakai di lingkungan kantor.

## 6. Encrypted Sync yang benar
Jika multi-device sync dibuat, sinkronkan ciphertext dan metadata minimum; gunakan akun untuk otorisasi, bukan sebagai alasan menyimpan plaintext. Tambahkan conflict resolution dan version vector / updatedAt policy yang jelas.

## 7. Reliable Reminder sebagai Worker terpisah
Untuk notifikasi saat PWA benar-benar tertutup, gunakan Web Push subscription + Cloudflare Worker Cron. Jangan menjanjikan timer browser sebagai push yang terjamin.

## 8. AI Cost Guard
Tambahkan kuota per perangkat/user, cache hash ringkasan periode, dan token budget. Jangan memanggil AI ulang bila data periode tidak berubah. Ini bisa memangkas biaya Pro secara signifikan.

## 9. Evidence Quality Assistant
Sebelum AI membuat Brag Document, cek apakah entry punya bukti dampak. Jika belum, AI cukup bertanya satu follow-up seperti “Apa perubahan yang terlihat setelah tindakan ini?” daripada mengarang hasil.

## 10. Commercial architecture
Untuk edisi personal saat ini, Pages + Functions cukup sederhana. Saat fitur server tumbuh (sync, push, team, auth, billing), pindahkan backend ke Cloudflare Workers dan pertahankan PWA sebagai local-first client.

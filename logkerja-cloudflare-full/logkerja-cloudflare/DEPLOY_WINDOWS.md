# Deploy Cloudflare dari Windows — langkah sederhana

## Pilihan A — paling direkomendasikan: GitHub → Cloudflare Pages

1. Extract `logkerja-cloudflare.zip` ke folder biasa, misalnya `D:\LogKerja`.
2. Buat repository GitHub kosong, lalu upload **isi folder proyek** (bukan ZIP-nya).
3. Di Cloudflare buka **Workers & Pages → Create application → Pages → Import existing Git repository**.
4. Pilih repository LogKerja.
5. Build settings:

```text
Framework preset : Next.js (Static HTML Export)
Build command    : npm run build
Build directory  : out
Production branch: main
```

6. Deploy. Setelah selesai, buka URL `https://<nama-project>.pages.dev`.
7. Di Android Chrome buka URL itu → menu `⋮` → **Install app**.

### Bila ingin AI

Di Cloudflare project → Settings → Variables and Secrets, buat:

```text
OPENAI_API_KEY  = <API key Anda>
OPENAI_MODEL    = gpt-5.6-luna
AI_ACCESS_TOKEN = <token panjang acak buatan Anda>
```

Redeploy. Setelah itu di LogKerja → Settings → **AI server gate** → masukkan nilai `AI_ACCESS_TOKEN` yang sama.

## Pilihan B — deploy dari Command Prompt / PowerShell

Pastikan Node.js sudah terpasang. Buka Terminal di folder LogKerja lalu:

```powershell
npm install
npx wrangler login
npm run deploy
```

Wrangler akan membuka browser untuk login Cloudflare. Jika project `logkerja` belum ada, buat Pages project terlebih dahulu di dashboard atau jalankan `npx wrangler pages project create`.

## Catatan penting

- Jangan mengupload source ZIP ke fitur drag-and-drop lalu berharap AI Function ikut aktif. Folder `/functions` perlu Git integration atau Wrangler.
- Jangan pernah membuat variabel `NEXT_PUBLIC_OPENAI_API_KEY`.
- Aktifkan PIN sebelum memasukkan diary kerja sensitif.
- Simpan `.lkbackup` terenkripsi secara berkala di tempat lain.

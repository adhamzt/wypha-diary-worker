# Deploy LogKerja ke Cloudflare Pages + Install di Android

## Cara paling mudah: GitHub → Cloudflare Pages

1. Extract ZIP LogKerja.
2. Buat repository GitHub baru dan upload seluruh isi folder proyek.
3. Masuk ke Cloudflare Dashboard → Workers & Pages → Create application → Pages → Import existing Git repository.
4. Pilih repository LogKerja.
5. Isi build settings:

```text
Framework preset : Next.js (Static HTML Export)
Build command    : npm run build
Build output     : out
```

6. Deploy.
7. Setelah selesai Anda memperoleh URL semacam `https://logkerja.pages.dev`.


> **Penting:** jika Anda ingin fitur AI `/api/ai`, jangan memakai drag-and-drop ZIP biasa di dashboard untuk deployment final. Gunakan Git integration atau Wrangler, karena folder root `/functions` perlu dikompilasi sebagai Pages Functions. Drag-and-drop hanya cocok untuk frontend statis tanpa Function.

## Aktifkan AI (opsional)

Di project Cloudflare Pages buka Settings → Variables and Secrets / Environment Variables dan tambahkan server-side values:

```text
OPENAI_API_KEY      = API key OpenAI Anda
OPENAI_MODEL        = gpt-5.6-luna
AI_ACCESS_TOKEN     = token panjang buatan Anda sendiri
```

Jangan memakai nama `NEXT_PUBLIC_OPENAI_API_KEY` karena prefix tersebut akan membuat secret tersedia ke client bundle.

Setelah menyimpan secrets, redeploy. Di Android LogKerja → Settings → AI server gate → masukkan nilai `AI_ACCESS_TOKEN` yang sama.

## Install Android

1. Buka URL `pages.dev` di Chrome Android.
2. Tunggu halaman selesai dibuka minimal sekali agar service worker aktif.
3. Menu Chrome `⋮` → **Install app** / **Add to Home screen**.
4. Buka icon **LogKerja** dari launcher.
5. Jalankan onboarding dan aktifkan PIN.

## Test offline

1. Setelah install, tunggu beberapa detik agar precache service worker selesai.
2. Aktifkan Airplane Mode.
3. Buka LogKerja lagi.
4. Coba Home, Quick Capture, Timeline, Insights lokal, Analytics, Help, dan Settings.
5. Tambahkan entry dan cek Timeline.
6. AI online/GitHub import memang membutuhkan internet; fitur inti tidak.

## Direct deploy dari komputer (opsional)

```bash
npm install
npx wrangler login
npm run build
npx wrangler pages deploy out --project-name logkerja
```

Untuk project baru, Wrangler/Cloudflare mungkin meminta Anda membuat atau memilih project Pages terlebih dahulu.

## Update aplikasi

Jika memakai Git integration: commit/push perubahan ke branch production. Cloudflare akan build ulang. Service worker LogKerja menggunakan versioned cache sehingga aset versi baru menggantikan cache lama setelah aktivasi.

## Jika nanti butuh true push, team mode, dan sync multi-device real-time

Pertahankan frontend PWA local-first, tetapi pindahkan fungsi server ke Cloudflare Workers (atau vinext) dan tambahkan autentikasi + database terenkripsi/sync. Jangan menjadikan IndexedDB sekadar cache; ia tetap sumber kerja offline.

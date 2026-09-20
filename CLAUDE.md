# Legwork — instruksi proyek

Dibaca otomatis setiap sesi. Baca ini dulu, lalu baca `CHECKPOINT.md` untuk
state terkini dan langkah berikutnya.

Bahasa ke user: **Bahasa Indonesia**. User berpengalaman teknis — jangan
menjelaskan hal mendasar.

## Apa ini

Lomba: **Convex All Gas Hackathon**. Deadline submit **23 Sept 2026, 02:00 WIB**
(= 22 Sept 12:00 PM PT). Hadiah juara 1 $10.000. Solo. Detail lengkap ada di
`PRD.md` — baca sebelum mengubah apa pun.

Produk: kamu jelaskan satu pekerjaan jasa lokal sekali. Legwork mencari
vendor-nya, mengirim email ke tiap vendor, mengejar yang diam, dan mengubah
balasan bebas mereka menjadi satu tabel yang bisa dibandingkan, terisi live.

Alur intinya — semua keputusan teknis tunduk pada alur ini:

```
Firecrawl search+scrape  → vendor + email asli
OpenAI                   → satu RFQ spesifik per vendor
AgentMail sendMessage    → email keluar dari inbox milik app
vendor membalas          → webhook → email.onMessageReceived
OpenAI                   → balasan prosa jadi baris terstruktur
Convex reactive query    → tabel terisi sendiri, tanpa refresh
Convex cron              → diam 48 jam dapat satu tagihan sopan
```

## INVARIAN — jangan diubah tanpa user menyuruh eksplisit

1. **Vertikal demo = perusahaan pindahan (movers) di kota AS.** Bukan UMKM
   Surabaya. Alasannya keras: UMKM Indonesia pakai WhatsApp, tidak publikasi
   email, jadi separuh loop (menerima balasan) mati total — dan itu bagian yang
   paling dinilai. Juri juga berbasis AS.
2. **`app.use(staticHosting)` TANPA `httpPrefix`**, dan `registerStaticRoutes`
   dipasang **terakhir** di `convex/http.ts`. Mode default akan memindahkan
   route app ke `/api` dan mematahkan URL webhook yang sudah didaftarkan.
3. **Jangan pernah menebak alamat email vendor.** Prompt ekstraksi Firecrawl
   wajib mengembalikan `null` kalau tidak ketemu. Vendor tanpa email tetap
   disimpan dan ditampilkan apa adanya.
4. **`quotes.rawExcerpt` dan `quotes.confidence` wajib terisi dan tampil di UI.**
   Parsing yang ragu harus terlihat ragu. Jangan pernah mengarang harga.
5. **Tanpa Tailwind, tanpa shadcn, tanpa component library.** CSS custom
   properties di `src/index.css` sudah mengunci palet (kertas hangat, tinta
   espresso, satu aksen rust) dan tipografi (Instrument Serif + JetBrains Mono).
   Tampilan default-blue/rounded-2xl langsung terbaca "AI-generated" oleh juri.
6. **Tanpa Three.js / WebGL.** Nol poin di rubrik, dan waktunya tidak ada.
7. **File Convex dengan `"use node"` hanya boleh berisi action.** `agent.ts` dan
   `discovery.ts` pakai Node runtime karena memanggil SDK. Mutation dan query
   harus tetap di file runtime default (`email.ts`, `projects.ts`, `board.ts`).

## OUT OF SCOPE — jangan dibangun

Kolaborasi multi-user dengan edit · pembayaran · portal sisi vendor · negosiasi
putaran kedua · mobile app · i18n · vertikal kedua · **landing page marketing
terpisah** (UI aplikasi ADALAH deliverable-nya).

Kalau MUST-HAVE di `PRD.md` belum selesai, potong semua NICE-TO-HAVE tanpa
bertanya.

## Peta file

| File | Isi |
|---|---|
| `convex/schema.ts` | projects · vendors · outreach · quotes · events |
| `convex/discovery.ts` | Firecrawl search → scrape JSON-extract (`"use node"`) |
| `convex/agent.ts` | OpenAI: buildSpec → draftRfq → parseReply (`"use node"`) |
| `convex/llm.ts` | helper OpenAI murni, bukan fungsi Convex |
| `convex/email.ts` | loop dua arah, outlier pass, target cron |
| `convex/projects.ts` | mutation/query app + internal helper |
| `convex/board.ts` | papan publik `/b/:token`, email vendor di-strip |
| `convex/http.ts` | route webhook + catch-all statis (urutan penting) |
| `convex/agentmailClient.ts` | instance AgentMail + `onMessageReceived` |
| `PRD.md` | scope MUST / OUT-OF-SCOPE / timeline harian |
| `hackathon.md` | build log bertanggal — **wajib diperbarui tiap hari kerja** |
| `CHECKPOINT.md` | state terkini + langkah berikutnya |

## Aturan kerja

- Setelah menyelesaikan satu blok kerja: perbarui `hackathon.md` (entri
  bertanggal, sebutkan commit), perbarui `CHECKPOINT.md`, lalu commit.
- **Jangan mengklaim sesuatu jalan tanpa menjalankannya.** Kalau typecheck belum
  jalan, katakan belum jalan.
- **Jangan push ke GitHub tanpa izin eksplisit user** untuk push pertama.
- Jangan tunda deploy ke akhir. Deploy produksi pertama dijadwalkan Sabtu.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

# PRD: Legwork
*Hackathon: Convex All Gas | Deadline: 23 Sept 2026 02:00 WIB | Tim: solo | Anggaran waktu: ~50 jam*

## 1. One-Liner
Kotak masuk yang mengejar lima vendor untukmu, lalu mengubah balasan mereka jadi satu tabel yang bisa dibandingkan.
**Ambition ceiling:** agent yang duduk di antara rumah tangga dan setiap bisnis lokal yang masih berjalan di atas email.

## 2. Insomnia Question
> Semua orang menyuruh kamu ambil tiga penawaran. Hampir tidak ada yang benar-benar melakukannya.
> Berapa yang kita bayar untuk itu?

## 3. Target User & Pain
- **Primary user** : orang yang sedang menghadapi satu urusan jasa lokal yang mahal dan jarang (pindahan, servis besar, renovasi kecil)
- **Pain sekarang**: menulis 5 email nyaris identik, melacak siapa yang sudah balas, membandingkan 5 format harga yang tidak sebanding, menagih yang diam
- **Stakes**      : rentang harga untuk pekerjaan identik bisa 2-3x. Kamu memilih dari satu sampel karena mengambil sampel kedua terlalu melelahkan. Kerugiannya tidak pernah terlihat.

## 4. Solution & Ambition
- **Core**        : satu papan per pekerjaan. Firecrawl temukan vendor + email. OpenAI tulis permintaan spesifik per vendor. AgentMail kirim dan MENERIMA. OpenAI normalisasi balasan jadi baris tabel. Convex isi papan realtime. Cron tagih yang diam setelah 48 jam.
- **Kalau berhasil**: lapisan agent untuk seluruh jasa lokal yang masih email-first
- **Sequel**      : v2 negosiasi putaran kedua · v3 vendor opt-in, monetisasi aliran lead

## 5. Scope MVP

### ✅ MUST HAVE (tanpa ini tidak ada produk)
1. **Buat pekerjaan** — deskripsi bebas + kota + foto opsional → OpenAI jadikan spec terstruktur
2. **Temukan vendor** — `firecrawl.search` + `firecrawl.scrape` JSON-extract → nama, email, area layanan, sumber URL
3. **Kirim RFQ** — OpenAI draft per vendor (menyebut hal spesifik yang ditemukan di situs mereka) → `agentmail.sendMessage` dengan label per pekerjaan
4. **Terima & parse balasan** — `onMessageReceived` → OpenAI → baris `quotes` terstruktur (harga, ketersediaan, termasuk/tidak termasuk, syarat, butuh info tambahan)
5. **Papan perbandingan realtime** — reactive query, terisi sendiri tanpa refresh, outlier ditandai
6. **Link papan publik** — `/b/:token` read-only, live. Melayani DUA fungsi: berbagi ke pasangan/teman, DAN demo mode tanpa login untuk juri
7. **Cron follow-up** — sapu tiap jam, tagih vendor yang diam >48 jam, maks 1x
8. **Deploy prod di convex.site**

### 🔶 NICE TO HAVE (hanya kalau MUST selesai sebelum Minggu malam)
- Vertikal kedua sebagai bukti generalisasi
- Convex Auth penuh (fallback: anonymous)
- Lampiran foto ikut terkirim di email
- Rate limiter

### ❌ OUT OF SCOPE (tidak dibangun, titik)
- Kolaborasi multi-user dengan edit (cukup share link read-only)
- Pembayaran, portal sisi vendor, negosiasi putaran kedua
- Mobile app, i18n, lebih dari satu vertikal di demo
- Landing page marketing terpisah — UI app ADALAH deliverable-nya
- Three.js / WebGL

## 6. The Demo

**Vertikal demo: perusahaan pindahan (local movers), kota di AS.**
Alasan: (a) juri berbasis AS — situs & email berbahasa Inggris terbaca, (b) mover publikasikan email, UMKM Indonesia umumnya hanya WhatsApp sehingga loop-nya MATI, (c) "get three moving quotes" adalah nasihat pepatah — insomnia question langsung nyambung.

- **Wow moment** : tabel kosong → kamu balas satu email dari HP → sel tabel terisi sendiri di layar, tanpa refresh
- **Side-by-side**: kiri "tanpa Legwork" (inbox pribadi, 1 balasan, 4 diam, 9 hari) · kanan "dengan Legwork" (4 balasan, tabel penuh, 6 menit)
- **Flow video (<3 menit)**:
  - 0:00-0:12 — LANGSUNG wow moment, tanpa intro tim. Layar tabel, email masuk, sel terisi. Teks: "Ini balasan vendor sungguhan, baru saja."
  - 0:12-0:30 — insomnia question, satu kalimat
  - 0:30-1:10 — buat pekerjaan → Firecrawl temukan 5 mover nyata + email (tunjukkan sumber URL-nya)
  - 1:10-1:45 — draft RFQ per vendor, kirim, status berubah live
  - 1:45-2:25 — balasan masuk, parsing jadi baris, outlier harga ditandai
  - 2:25-2:50 — side-by-side, lalu share link dibuka di ponsel kedua yang ikut update live
  - 2:50-3:00 — satu kalimat penutup + URL

## 7. Judging Criteria Mapping (buktikan, bukan sentuh)

| Kriteria | Bagaimana DIBUKTIKAN di layar |
|---|---|
| Everyday, bukan dev tool | Pindahan rumah. Nol baris kode terlihat di video. |
| Convex depth | httpAction 2 webhook · reactive query dipicu event eksternal · scheduler · crons · indexes · file storage · Auth · 4 komponen |
| Firecrawl nyata | `search` + `scrape` JSON-extract vendor asli; sumber URL ditampilkan di UI |
| AgentMail nyata | Inbox milik app, DUA ARAH, `onMessageReceived` memicu agent. Thread & label terlihat. |
| OpenAI nyata | Spec dari teks bebas · draft per-vendor · parsing balasan berantakan jadi field · deteksi outlier |
| Live URL | convex.site + share link publik yang juri klik tanpa daftar |
| Video | wow moment di 12 detik pertama |

## 8. Tech Stack & Risk
- **Stack**: Convex + TypeScript + React + Vite · `@agentmail/convex` · `@firecrawl/firecrawl-convex` · `@convex-dev/static-hosting` · `@convex-dev/auth` · OpenAI API
- **Risiko 1 — vendor tidak balas saat demo**: siapkan 2-3 inbox AgentMail sendiri sebagai "vendor" untuk jalur demo terkontrol, DAN tetap tunjukkan minimal 1 balasan vendor asli. Label jujur di UI.
- **Risiko 2 — parsing balasan tidak akurat**: batasi ke skema kecil, simpan `rawExcerpt` + `confidence`, tampilkan kutipan asli di bawah tiap sel. Ketidakpastian yang jujur lebih kuat dari angka palsu.
- **Risiko 3 — Firecrawl tidak menemukan email**: fallback ke `map` → halaman /contact → scrape. Kalau tetap nihil, tandai vendor "email tidak ditemukan" dan tetap tampilkan; kejujuran ini justru poin.
- **Backup plan demo mati**: video sudah direkam H-1, share link statis dengan data seed selalu hidup.

## 9. Prize Stacking
Tidak ada. Hanya Juara 1/2/3, tanpa track sponsor terpisah. Seluruh effort ke satu track.

## 10. Timeline (WIB)
| Hari | Jam | Target |
|---|---|---|
| Rab 16 | sisa | Akun (Convex, AgentMail, Firecrawl 20k, OpenAI) · scaffold · 4 komponen terpasang · repo publik · commit + `hackathon.md` pertama |
| Kam 17 | 8 | Schema + indexes · pipeline Firecrawl discovery jalan dengan mover ASLI · OpenAI spec-builder |
| Jum 18 | 8 | **Hari terpenting** — loop AgentMail dua arah utuh: send → webhook → `onMessageReceived` → parse OpenAI → baris quotes |
| Sab 19 | 8 | UI papan realtime · side-by-side · share link `/b/:token` · **deploy prod pertama** (jangan tunda) |
| Min 20 | 8 | Data seed demo · anti-AI-slop pass (tipografi, palet, layout, copy) · cron follow-up · outlier flag |
| Sen 21 | 8 | Rekam & edit video · post X + LinkedIn tag 4 akun · rapikan `hackathon.md` + README |
| Sel 22 | buffer | Submit SIANG WIB. Jangan tunggu 02:00 dini hari. |

**Aturan buffer**: kalau Jumat malam loop dua arah belum utuh, potong NICE-TO-HAVE tanpa negosiasi.

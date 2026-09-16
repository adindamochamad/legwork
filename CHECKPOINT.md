# CHECKPOINT — Legwork

**Diperbarui: 16 Sept 2026 (Rabu).**
Baca `CLAUDE.md` dulu (invarian & larangan), lalu file ini.

---

## Sisa waktu

Deadline submit: **23 Sept 2026, 02:00 WIB**. Sekitar **6 hari**.
Jadwal harian lengkap ada di `PRD.md` bagian 10.

---

## STATE SEKARANG

**Selesai (commit lokal `e76cf43`):**
- Scaffold penuh: Convex + React 19 + Vite 8 + TypeScript 5.9
- `npm install` sudah jalan, semua paket terpasang, binary esbuild sudah approved
- 3 komponen terpasang di `convex/convex.config.ts`: `@agentmail/convex`,
  `@firecrawl/firecrawl-convex`, `@convex-dev/static-hosting`
- Schema 5 tabel + indexes
- Seluruh kerangka loop ditulis: discovery → draft → send → receive → parse →
  board → cron
- Palet & tipografi anti-AI-slop dikunci di `src/index.css`
- `PRD.md`, `README.md`, `hackathon.md`, `CLAUDE.md` ada

**BELUM selesai / BELUM terverifikasi — jangan anggap ini jalan:**
- ❌ **Belum pernah typecheck.** `convex/_generated/` belum ada. Semua import
  `./_generated/api` dan `./_generated/server` masih merah. Ini normal — folder
  itu baru lahir setelah `npx convex dev` menyentuh deployment sungguhan.
- ❌ Belum ada deployment Convex, belum ada API key terpasang
- ❌ Belum ada email terkirim, belum ada balasan diterima, belum ada vendor asli
- ❌ Belum push ke GitHub (repo wajib **publik** sebelum submit)
- ❌ Belum deploy, belum ada video, belum post sosial

---

## LANGKAH BERIKUTNYA — kerjakan berurutan

### Langkah 1 — user yang jalankan (butuh login, tidak bisa diwakilkan)

```bash
cd ~/Development/legwork
npx convex dev        # login Convex, buat deployment, tulis .env.local + _generated/
```

Lalu set secret di deployment (bukan di file):

```bash
npx convex env set OPENAI_API_KEY sk-...
npx convex env set OPENAI_MODEL <id model yang benar-benar ada di akun user>
npx convex env set FIRECRAWL_API_KEY fc-...
npx convex env set FIRECRAWL_WEBHOOK_SECRET whsec-...
npx convex env set AGENTMAIL_API_KEY ...
npx convex env set AGENTMAIL_INBOX_ID <inbox>@agentmail.to
npx convex env set AGENTMAIL_WEBHOOK_SECRET whsec_...
```

Daftarkan di dashboard AgentMail:
`https://<deployment>.convex.site/agentmail/webhook`

### Langkah 2 — perbaiki apa pun yang gagal compile

```bash
npm run typecheck
```

Ini kemungkinan besar **akan gagal pertama kali**. Yang wajar muncul:
- nama fungsi component tidak cocok → cek README paket di
  `node_modules/@agentmail/convex/README.md` dan
  `node_modules/@firecrawl/firecrawl-convex/README.md`, ikuti README-nya
- tipe `outboundId` di `convex/email.ts` — sekarang masih pakai cast paksa
- `v.any()` di beberapa arg internal sengaja dipakai supaya longgar; biarkan

Perbaiki sampai `npm run typecheck` bersih. **Jangan** mengubah arsitektur untuk
menghindari error — perbaiki pemanggilannya saja.

### Langkah 3 — buktikan Firecrawl menemukan mover ASLI

Ini yang paling rawan. Bentuk hasil `firecrawl.search` di
`convex/discovery.ts` masih tebakan defensif:

```ts
const hits = found?.web ?? found?.data ?? found?.results ?? [];
```

Jalankan sekali dengan key asli, `console.log` hasil mentahnya, lalu ganti baris
itu dengan bentuk yang sebenarnya. Target: 5-6 perusahaan pindahan asli di satu
kota AS, minimal 3 di antaranya punya email yang benar-benar ditemukan di
halamannya.

### Langkah 4 — tutup loop dua arah (HARI PALING PENTING)

Urutan pembuktian, satu per satu:
1. RFQ terkirim, status `outreach` jadi `sent`
2. Balas email itu dari akun pribadi → `email.onMessageReceived` terpicu
3. `agent.parseIncoming` menghasilkan baris di tabel `quotes`
4. Baris muncul di UI **tanpa refresh**

Kalau langkah 2 tidak terpicu: hampir selalu webhook URL atau
`AGENTMAIL_WEBHOOK_SECRET` yang salah.

### Langkah 5 dan seterusnya

Ikuti `PRD.md` bagian 10: Sabtu UI + share link + **deploy prod pertama**,
Minggu seed demo + polish + cron, Senin video + sosial, Selasa submit siang WIB.

---

## JEBAKAN YANG SUDAH DIKETAHUI

| Jebakan | Yang benar |
|---|---|
| Menambah `httpPrefix` ke `staticHosting` | JANGAN. URL webhook akan pindah ke `/api` dan patah. Lihat `CLAUDE.md` invarian #2. |
| Menaruh mutation di file `"use node"` | Tidak boleh. `agent.ts`/`discovery.ts` hanya action. |
| `npm run build` gagal | Wajar sebelum `npx convex dev` jalan — `_generated/` belum ada. |
| Model OpenAI default `gpt-4o-mini` | Hanya jaring pengaman. Set `OPENAI_MODEL` ke model nyata di akun user. |
| LLM mengarang harga | `llm.ts` sudah melarangnya di prompt. Jangan longgarkan aturan itu. |
| Tergoda menambah fitur | Cek OUT OF SCOPE di `CLAUDE.md`. Waktu hanya 6 hari, solo. |

---

## CHECKLIST SUBMIT (semua wajib, cek sebelum 23 Sept 02:00 WIB)

- [ ] Repo GitHub **publik** (bukan private)
- [ ] URL live di `convex.site`, **bisa dibuka tanpa akun** — pakai share link `/b/:token`
- [ ] Video demo **di bawah 3 menit**, wow moment di 12 detik pertama
- [ ] Ketiga sponsor bekerja nyata saat runtime (bukan hanya disebut di README)
- [ ] Post di X **dan/atau** LinkedIn, tag `@convex @openai @firecrawl @agentmail`
- [ ] `hackathon.md` lengkap dengan log bertanggal
- [ ] Tidak ada kode dari sebelum 25 Agustus 2026
- [ ] Submit di https://vibeapps.dev/judging/convex-all-gas-hackathon-openai/submit
- [ ] Submit **siang WIB tanggal 22**, jangan menunggu 02:00 dini hari

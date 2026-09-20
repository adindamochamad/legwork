# CHECKPOINT — Legwork

**Diperbarui: 20 Sept 2026 (Minggu, ~22:35 WIB).**
Baca `CLAUDE.md` dulu (invarian & larangan), lalu file ini.

---

## Sisa waktu

Deadline submit: **23 Sept 2026, 02:00 WIB** (= 22 Sept 12:00 PT).
Target aman: **submit Selasa 22 siang WIB**.

---

## Deployments

| Env | Convex | Site | Catatan |
|-----|--------|------|---------|
| **Dev** | `knowing-narwhal-778` | https://knowing-narwhal-778.convex.site | `.env.local` → dev; `npm run dev` / `upload:static` |
| **Prod** | `hip-egret-263` | https://hip-egret-263.convex.site | Submit & video pakai **prod** |

**AgentMail webhook prod:** `https://hip-egret-263.convex.site/agentmail/webhook`  
**Inbox:** `adindamochamad@agentmail.to` (env prod + dev)

---

## STATE — selesai & terverifikasi

- Firecrawl discovery mover AS (Denver/Austin) di dev
- OpenAI spec / RFQ / parse; fix `caveats` → `stringList` di `email.ts`
- AgentMail send + patch env ke component (`convex.config.ts` + `patch-package`)
- Loop Gmail **dev** dan **prod** (balas → inbound → `replied` → quote + excerpt)
- UI brutal / quote-ledger (`src/App.tsx`, `src/index.css`) — static **prod** uploaded
- Prod backend deployed (`bash scripts/convex.sh deploy`); env prod 6 variabel mirror dev
- `syncOutreachThread` + logging `[legwork inbound]` di `email.ts` (deploy prod OK)

### Demo board prod (untuk juri / README / video)

- **Live app:** https://hip-egret-263.convex.site
- **Share board (Gmail loop, $2.2k quote, 90% confidence):**  
  https://hip-egret-263.convex.site/b/bqna40u53weq
- Project id prod: `jd79d5yd4nj5701kevwewvc1s98eseqv`

### Dev demo (cadangan)

- https://knowing-narwhal-778.convex.site/b/44wwk3jlq6do (data dev, bukan prod)

---

## BELUM — blocker submit

- [x] **GitHub repo publik** + push — https://github.com/adindamochamad/legwork
- [x] **README** — URL prod, demo `bqna40u53weq`, stack sponsor, cara run
- [x] **hackathon.md** — entri prod loop + demo URL + GitHub publik
- [ ] **Video** <3 menit (wow: reply → baris board)
- [ ] **Post** X/LinkedIn tag `@convex @openai @firecrawl @agentmail`
- [ ] **Submit** https://vibeapps.dev/judging/convex-all-gas-hackathon-openai/submit

Opsional: full E2E prod lewat form home (Firecrawl multi-vendor); outlier UI butuh ≥3 quote.

---

## LANGKAH BERIKUTNYA (sesi baru)

1. **hackathon.md** — entri GitHub publik (repo URL)
2. **Video + sosial**
3. **vibeapps submit** (Sel 22 siang WIB)

Perintah berguna:

```bash
bash scripts/convex.sh deploy          # prod backend
npx @convex-dev/static-hosting upload --build --prod
npm run upload:static                  # dev static only
npx convex run agent:sendGmailLoopTest '{"vendorEmail":"..."}' --prod
```

---

## CHECKLIST SUBMIT

- [x] URL live convex.site tanpa login (share `/b/:token`)
- [x] Sponsor stack nyata di prod (Firecrawl/OpenAI/AgentMail di loop; board = Convex reactive)
- [x] Repo publik
- [ ] Video <3 menit
- [ ] Post sosial + tag sponsor
- [x] hackathon.md lengkap
- [ ] vibeapps submit

---

## JEBAKAN (ringkas)

- Jangan `httpPrefix` on staticHosting (webhook pindah).
- `convex deploy` harus interaktif (y) — agent shell non-TTY gagal.
- Balas RFQ harus **Reply** dari `vendor.email` ke inbox AgentMail; thread **prod** ≠ dev.
- Setelah ubah frontend: `upload --build --prod`.

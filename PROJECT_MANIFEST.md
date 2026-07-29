# PROJECT MANIFEST

## STATUS
- **Current Goal:** SEO Audit Landing Page — external users enter a URL + email, receive a live on-page report with fix guides + native print-to-PDF.
- **Last Session Date:** 2026-07-28
- **Status:** LIVE at https://seoaudit-five.vercel.app
- **Lead capture:** Active via Make webhook → GHL (email, url, score sent on each audit)

## SYSTEM STATE
- **Project Root:** `F:\Mike d drive\Mike Webs\mAIstermind.com\projects\seoaudit-landing`
- **Backend:** Node.js/Express (`server.js`), deployed on Vercel as serverless function
- **Frontend:** Vanilla HTML/CSS/JS in `public/`
- **API:** RankNibbler (free tier, 100 audits/day)
- **SMTP:** Nodemailer (not configured — no SMTP_HOST set)
- **Vercel:** `dynamicmikes-projects/seoaudit` → `https://seoaudit-five.vercel.app`
- **Git:** `https://github.com/dynamicmike-dashboard/seoaudit.git` (branch `main`)
- **Vercel Token:** set in `.env` as `VERCEL_TOKEN`
- **API Key:** set as Vercel env var `RANKNIBBLER_API_KEY`

## FILES
| File | Purpose |
|------|---------|
| `server.js` | Express backend — proxies RankNibbler API, health/debug/checkkey endpoints, Make webhook lead POST |
| `public/index.html` | Landing page — light pastel theme, PWA manifest + service worker, video bg, form, score ring, issues with fix guides, PDF button |
| `public/style.css` | Light pastel theme (lavender/white), responsive layout, toggle guides |
| `public/script.js` | Frontend — form submit, animated score ring, checks grid, issues with expandable fix guides, native print-to-PDF via new window + auto-print |
| `public/manifest.json` | PWA manifest — standalone display, SVG icon, purple theme |
| `public/icons/icon.svg` | PWA icon — magnifying glass + green checkmark on purple |
| `public/sw.js` | Service worker — caches app shell for offline access |
| `vercel.json` | Routes `/api/(.*)` → `server.js`, static from `public/`, `@vercel/node` build |
| `package.json` | Dependencies: express, nodemailer, dotenv; vercel-build script |
| `.env` | Live config (not deployed to Vercel — env vars set in dashboard) |
| `.env.example` | Config template |
| `SYSTEM_PROTOCOL.md` | AI behavior rules |
| `PROJECT_MANIFEST.md` | This file — project state & memory |
| `COMMANDS.md` | Task prompt library |

## KEY DESIGN DECISIONS
- No `.env` on Vercel — `RANKNIBBLER_API_KEY` set as Vercel Environment Variable in dashboard
- Pastel light theme (`#f8f6ff` bg, white surfaces, lavender borders, navy text, `#6c5ce7` accent)
- Background: Pexels tech video (`https://www.pexels.com/download/video/29718114/`) at 25% opacity
- Footer: "Powered by 1st-page-ranking" → `https://1st-page-ranking.com`
- Fix guides: each issue has a "Why it matters" + "How to fix" expandable toggle
- PDF: one-click download via html2pdf.js CDN, A4 format with score ring, issues, and full fix guides
- Email field kept for future GHL lead capture (not currently sent anywhere)

## PENDING / NEXT
- [x] Push to GitHub, deploy to Vercel
- [x] Fix 500 error (unclosed `/*` block comment)
- [x] Add PDF download with fix guides
- [x] Connect email leads to GHL CRM via Make webhook
- [x] PWA — manifest.json, SVG icon, service worker, theme-color meta
- [ ] Configure SMTP for email delivery (optional)
- [ ] Rate limiting / abuse protection (optional)
- [ ] Custom subdomain (seoaudit.1st-page-ranking.com) (optional)

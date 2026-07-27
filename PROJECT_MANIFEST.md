# PROJECT MANIFEST

## STATUS
- **Current Goal:** SEO Audit Landing Page — external users enter a URL + email, receive a live on-page report + emailed HTML report.
- **Last Session Date:** 2026-07-26

## SYSTEM STATE
- **Project Root:** `F:\Mike d drive\Mike Webs\mAIstermind.com\projects\seoaudit-landing`
- **Backend:** Node.js/Express (`server.js`) on port 3000
- **Frontend:** Vanilla HTML/CSS/JS in `public/`
- **API:** RankNibbler (free tier, 100 audits/day)
- **Email:** Nodemailer via SMTP (configured in `.env`)
- **API Key (live, in .env):** `rnk_live_290ae0e32c7dfbcb28aee201993a8935f69ba70e386ec589`

## FILES
| File | Purpose |
|------|---------|
| `server.js` | Express backend — serves landing page, proxies RankNibbler API, sends email |
| `public/index.html` | Landing page with URL + email form, score ring, checks grid |
| `public/style.css` | Dark theme, responsive layout |
| `public/script.js` | Frontend logic — form submit, animated counters, render results |
| `.env.example` | Config template |
| `.env` | Live config (API key, SMTP settings) |
| `package.json` | Dependencies: express, nodemailer, dotenv |

## PENDING / NEXT
- [x] Push to GitHub
- [x] Deploy to Vercel as subdomain
- [ ] Configure SMTP to enable email delivery of reports
- [ ] Add lead capture database (optional)
- [ ] Rate limiting / abuse protection (optional)

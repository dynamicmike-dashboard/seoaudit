# COMMANDS

## TASK: ADD SMTP EMAIL
"Initialize from SYSTEM_PROTOCOL.md. Read PROJECT_MANIFEST.md. Configure nodemailer in .env with SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL. Restart server and test email delivery."

## TASK: ADD REPORT HISTORY
"Initialize from SYSTEM_PROTOCOL.md. Read PROJECT_MANIFEST.md. Add a JSON file or SQLite database to store past audit results. Display a history table on the landing page. New fields: timestamp, url, email, score, grade."

## TASK: DEPLOY TO PRODUCTION
"Initialize from SYSTEM_PROTOCOL.md. Read PROJECT_MANIFEST.md. Set up PM2 or similar process manager. Configure reverse proxy (nginx/Caddy) if needed. Update .env with production values."

## TASK: ADD RATE LIMITING
"Initialize from SYSTEM_PROTOCOL.md. Read PROJECT_MANIFEST.md. Add express-rate-limit middleware to /api/audit. Limit to 10 requests per IP per hour. Return 429 with clear message."

## TASK: WHITE-LABEL BRANDING
"Initialize from SYSTEM_PROTOCOL.md. Read PROJECT_MANIFEST.md. Add BRAND_NAME, BRAND_COLOR, LOGO_URL to .env. Update landing page and email template to use dynamic branding."

## TASK: CONNECT GHL LEAD CAPTURE
"Initialize from SYSTEM_PROTOCOL.md. Read PROJECT_MANIFEST.md. After audit completes in server.js, POST { email, url, score, timestamp } to GHL_WEBHOOK_URL from .env. Log success/failure. Add GHL_WEBHOOK_URL to .env.example."

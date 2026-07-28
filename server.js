const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

console.log('VERCEL env check:', process.env.VERCEL, process.env.VERCEL_ENV, process.env.VERCEL_URL);

let RN_API_KEY;
function reloadKey() {
  RN_API_KEY = process.env.RANKNIBBLER_API_KEY || process.env.SEOAUDIT_API_KEY;
}
reloadKey();
const FROM_EMAIL = process.env.FROM_EMAIL || 'reports@yourdomain.com';
const FROM_NAME = process.env.FROM_NAME || 'SEO Audit Report';

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

console.log('Server init: RANKNIBBLER_API_KEY present =', !!process.env.RANKNIBBLER_API_KEY, 'key length =', (process.env.RANKNIBBLER_API_KEY || '').length);
console.log('All env keys:', Object.keys(process.env).join(', '));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, hasKey: !!process.env.RANKNIBBLER_API_KEY, node: process.version });
});

app.get('/api/debug', (req, res) => {
  const envNames = Object.keys(process.env).filter(k => /api|key|secret|token/i.test(k));
  res.json({
    node: process.version,
    vercel: !!process.env.VERCEL,
    vercelEnv: process.env.VERCEL_ENV || 'unknown',
    rnKeyExists: 'RANKNIBBLER_API_KEY' in process.env,
    rnKeyLength: (process.env.RANKNIBBLER_API_KEY || '').length,
    envNames,
  });
});

app.all('/api/checkkey', (req, res) => {
  const key = process.env.RANKNIBBLER_API_KEY || process.env.SEOAUDIT_API_KEY;
  res.json({
    method: req.method,
    path: '/api/checkkey',
    rnKeyExists: 'RANKNIBBLER_API_KEY' in process.env,
    rnKeyLength: (process.env.RANKNIBBLER_API_KEY || '').length,
    seoKeyExists: 'SEOAUDIT_API_KEY' in process.env,
    keyFound: !!key,
    allKeys: Object.keys(process.env).filter(k => /api|key/i.test(k)),
  });
});

let transporter = null;
if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

app.post('/api/audit', async (req, res) => {
  try {
    const { url, email } = req.body || {};
    console.log('POST /api/audit called', 'url:', url, 'email:', email, 'hasKey:', !!process.env.RANKNIBBLER_API_KEY, 'keyLen:', (process.env.RANKNIBBLER_API_KEY||'').length);

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Valid URL is required' });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const cleanUrl = url.startsWith('http') ? url : `https://${url}`;

    const key = process.env.RANKNIBBLER_API_KEY || process.env.SEOAUDIT_API_KEY;
    if (!key) {
      console.error('API key check FAILED - env RANKNIBBLER_API_KEY present:', 'RANKNIBBLER_API_KEY' in process.env, 'length:', (process.env.RANKNIBBLER_API_KEY||'').length, 'allEnvKeys:', Object.keys(process.env).join(','));
      return res.status(500).json({ error: 'API key not configured. Set RANKNIBBLER_API_KEY in .env' });
    }

    // Probe call to verify key works standalone
    try {
      const probeUrl = new URL('https://www.ranknibbler.com/api/v1/audit');
      probeUrl.searchParams.set('url', cleanUrl);
      const probeRes = await fetch(probeUrl.toString(), {
        method: 'GET',
        headers: { 'X-API-Key': key },
      });
      if (!probeRes.ok) {
        const errText = await probeRes.text();
        return res.json({ debug: true, keyExists: true, keyLength: key.length, keyPrefix: key.substring(0,8), probeStatus: probeRes.status, probeError: errText.substring(0,200) });
      }
      const auditData = await probeRes.json();
      return res.json({ debug: true, keyExists: true, keyLength: key.length, keyPrefix: key.substring(0,8), probeOk: true, dataKeys: Object.keys(auditData).join(',') });
    } catch (probeErr) {
      return res.json({ debug: true, keyExists: true, keyLength: key.length, keyPrefix: key.substring(0,8), probeException: probeErr.message, probeStack: (probeErr.stack||'').substring(0,300) });
    }

  } catch (error) {
    console.error('Audit error:', error);
    res.status(500).json({ error: error.message });
  }
});

function buildEmailHtml(r) {
  const scoreColor = r.score >= 80 ? '#10b981' : r.score >= 60 ? '#f59e0b' : r.score >= 40 ? '#f97316' : '#ef4444';

  const checks = [
    { label: 'SSL / HTTPS', ok: r.isHttps },
    { label: 'Title Tag', ok: r.titleLength >= 30 && r.titleLength <= 60 },
    { label: 'Meta Description', ok: r.metaDescLength >= 50 && r.metaDescLength <= 160 },
    { label: 'Favicon', ok: r.hasFavicon },
    { label: 'Canonical Tag', ok: !!r.canonical?.present },
    { label: 'Open Graph Tags', ok: (r.openGraph?.count || 0) > 0 },
    { label: 'H1 Present', ok: (r.headings?.h1Count || 0) >= 1 },
    { label: 'Noindex', ok: !r.technical?.noindex },
    { label: 'Word Count', ok: (r.wordCount || 0) >= 300 },
  ];

  const checksHtml = checks.map(c =>
    `<tr><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:13px;">${c.label}</td><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:center;">${c.ok ? '&#10003;' : '&#10007;'}</td></tr>`
  ).join('');

  const issuesHtml = r.issuesList.length > 0
    ? r.issuesList.map(issue =>
        `<tr><td style="padding:4px 8px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#6b7280;">${issue}</td></tr>`
      ).join('')
    : '<tr><td style="padding:4px 8px;font-size:12px;color:#10b981;">No issues found!</td></tr>';

  const techHtml = r.techStack.length > 0
    ? r.techStack.map(t => `${t.name}`).join(', ')
    : 'None detected';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:24px;margin-bottom:24px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
<tr><td style="padding:32px 32px 24px;background:linear-gradient(135deg,#6c5ce7,#8b5cf6);text-align:center;">
  <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;">Your SEO Audit Report</h1>
  <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">${r.host}</p>
</td></tr>
<tr><td style="padding:24px 32px;">
  <div style="text-align:center;margin-bottom:20px;">
    <div style="display:inline-block;width:100px;height:100px;border-radius:50%;background:conic-gradient(${scoreColor} ${r.score}%, #e5e7eb ${r.score}%);display:flex;align-items:center;justify-content:center;position:relative;">
      <div style="position:absolute;inset:8px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:${scoreColor};">${Math.round(r.score)}</div>
    </div>
    <p style="font-size:12px;color:#9ca3af;margin-top:6px;">Grade: ${r.grade} &middot; out of 100</p>
  </div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
    <tr>
      <td style="text-align:center;padding:12px;background:#f0fdf4;border-radius:8px;width:50%;">
        <div style="font-size:20px;font-weight:700;color:#10b981;">${r.passedTests}</div>
        <div style="font-size:11px;color:#6b7280;">Checks Passed</div>
      </td>
      <td style="text-align:center;padding:12px;background:#fef2f2;border-radius:8px;width:50%;">
        <div style="font-size:20px;font-weight:700;color:#ef4444;">${r.totalIssues}</div>
        <div style="font-size:11px;color:#6b7280;">Issues Found</div>
      </td>
    </tr>
  </table>

  <h3 style="font-size:16px;font-weight:600;margin:20px 0 8px;">Key Checks</h3>
  <table style="width:100%;border-collapse:collapse;">${checksHtml}</table>

  <h3 style="font-size:16px;font-weight:600;margin:20px 0 8px;">Issues Found</h3>
  <table style="width:100%;border-collapse:collapse;">${issuesHtml}</table>

  <h3 style="font-size:16px;font-weight:600;margin:20px 0 8px;">Technology Stack</h3>
  <p style="font-size:13px;color:#6b7280;margin:0;">${techHtml}</p>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
  <p style="font-size:12px;color:#9ca3af;text-align:center;">Powered by RankNibbler API &mdash; ${new Date().toISOString().split('T')[0]}</p>
</td></tr></table></body></html>`;
}

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`SEO Audit Landing running at http://localhost:${PORT}`);
    if (!RN_API_KEY) console.warn('WARNING: No API key set. Get a free key at https://www.ranknibbler.com/register');
    else console.log('Using RankNibbler API (100 free audits/day)');
    if (!process.env.SMTP_HOST) console.warn('WARNING: SMTP not configured. Reports display on-screen but will not be emailed.');
  });
}

module.exports = app;

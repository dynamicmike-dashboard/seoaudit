document.getElementById('footer-year').textContent = new Date().getFullYear();

const form = document.getElementById('audit-form');
const submitBtn = document.getElementById('submit-btn');
const btnText = submitBtn.querySelector('.btn-text');
const btnLoading = submitBtn.querySelector('.btn-loading');
const resultsSection = document.getElementById('results-section');
const results = document.getElementById('results');
const errorBox = document.getElementById('error-box');
const errorMsg = document.getElementById('error-msg');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const url = document.getElementById('url').value.trim();
  const email = document.getElementById('email').value.trim();

  if (!url || !email) return;

  setLoading(true);
  resultsSection.hidden = true;
  errorBox.hidden = true;

  try {
    const res = await fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, email }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Audit request failed');
    }

    renderReport(data.report);
    resultsSection.hidden = false;
  } catch (err) {
    errorMsg.textContent = err.message;
    errorBox.hidden = false;
    resultsSection.hidden = false;
  } finally {
    setLoading(false);
  }
});

function setLoading(loading) {
  submitBtn.disabled = loading;
  btnText.hidden = loading;
  btnLoading.hidden = !loading;
}

let lastReport = null;

const seoGuides = {
  'title': {
    name: 'Title Tag',
    why: 'The title appears in search results as the clickable headline. It is a primary ranking factor and the first thing users see.',
    fix: 'Write a unique, descriptive title (30-60 characters) with your primary keyword near the front. Use a pipe or dash separator for branding.'
  },
  'meta description': {
    name: 'Meta Description',
    why: 'Meta descriptions appear under the title in search results. A compelling description increases click-through rates.',
    fix: 'Write 50-160 characters summarizing the page with a clear value proposition and call to action.'
  },
  'heading': {
    name: 'Heading Structure (H1/H2)',
    why: 'Headings create a content hierarchy for users and search engines. H1 is the main title; H2s break up sections.',
    fix: 'Use exactly one H1 per page matching the page topic. Add descriptive H2s for each content section.'
  },
  'canonical': {
    name: 'Canonical Tag',
    why: 'Canonical tags tell search engines which URL is the authoritative version, preventing duplicate content issues.',
    fix: 'Add <link rel="canonical" href="..." /> pointing to the preferred URL version, especially for paginated or parameterized pages.'
  },
  'open graph': {
    name: 'Open Graph Tags',
    why: 'Open Graph tags control how your page appears when shared on Facebook, LinkedIn, WhatsApp, and other platforms.',
    fix: 'Add og:title, og:description, og:image, and og:url meta tags to your page head.'
  },
  'structured data': {
    name: 'Structured Data (JSON-LD)',
    why: 'Structured data helps search engines understand your content and enables rich results like stars, FAQs, and recipes.',
    fix: 'Add JSON-LD structured data appropriate to your content type (Article, Product, LocalBusiness, FAQ, etc.).'
  },
  'favicon': {
    name: 'Favicon',
    why: 'A favicon appears in browser tabs, bookmarks, and search result snippets. It builds brand recognition.',
    fix: 'Add a <link rel="icon" href="/favicon.ico" /> or use PNG favicons with the appropriate size tags.'
  },
  'https': {
    name: 'SSL / HTTPS',
    why: 'HTTPS encrypts data between the user and your server. Google uses it as a ranking signal and browsers warn on non-HTTPS.',
    fix: 'Install an SSL certificate (free via Let\'s Encrypt) and redirect all HTTP traffic to HTTPS using 301 redirects.'
  },
  'word count': {
    name: 'Word Count (Content Depth)',
    why: 'Thin content (under 300 words) often fails to satisfy search intent and ranks poorly.',
    fix: 'Expand your content to at least 300 words per page. Cover the topic thoroughly with original research, examples, and actionable advice.'
  },
  'noindex': {
    name: 'Noindex Tag',
    why: 'A noindex tag tells search engines not to index the page. When used unintentionally, the page disappears from search results.',
    fix: 'Remove the <meta name="robots" content="noindex" /> tag unless you specifically want the page excluded from search.'
  },
  'text/html ratio': {
    name: 'Text-to-HTML Ratio',
    why: 'A very low ratio suggests excessive code vs actual content, which can hurt rankings.',
    fix: 'Minimize inline styles/scripts, move CSS/JS to external files, and ensure your page has substantial readable content.'
  },
  'internal links': {
    name: 'Internal Links',
    why: 'Internal links help search engines discover pages and distribute authority across your site.',
    fix: 'Add contextual internal links between related pages using descriptive anchor text.'
  },
  'external links': {
    name: 'External Links',
    why: 'Linking to authoritative sources adds credibility and helps search engines understand your content.',
    fix: 'Link to relevant authoritative sources with descriptive anchor text and rel="noopener" for security.'
  },
  'image alt': {
    name: 'Image Alt Text',
    why: 'Alt text helps search engines understand images and is used by screen readers for accessibility.',
    fix: 'Add descriptive alt text to every image. Include keywords naturally where relevant.'
  },
  'hreflang': {
    name: 'Hreflang Tags (i18n)',
    why: 'Hreflang tags tell search engines which language/region version of a page to show to users.',
    fix: 'Add <link rel="alternate" hreflang="x" href="..." /> for each language version of your page.'
  },
  'robots.txt': {
    name: 'Robots.txt',
    why: 'Robots.txt controls which parts of your site search engines can crawl. A missing or overly restrictive file can hide pages.',
    fix: 'Create a robots.txt at /robots.txt allowing access to important pages and disallowing admin/private areas.'
  },
  'sitemap': {
    name: 'XML Sitemap',
    why: 'A sitemap helps search engines discover all pages on your site, especially new or deep pages.',
    fix: 'Generate an XML sitemap and submit it in Google Search Console. Reference it in robots.txt.'
  },
  'viewport': {
    name: 'Viewport / Mobile Friendliness',
    why: 'Mobile-first indexing means Google primarily uses the mobile version for ranking and indexing.',
    fix: 'Ensure your site uses responsive design with <meta name="viewport" content="width=device-width, initial-scale=1" />.'
  },
  'performance': {
    name: 'Page Performance',
    why: 'Page speed affects user experience and rankings. Slow pages have higher bounce rates.',
    fix: 'Optimize images, minify CSS/JS, leverage browser caching, use a CDN, and consider lazy loading below-fold images.'
  },
  'thin content': {
    name: 'Thin Content',
    why: 'Pages with very little content provide little value to users and struggle to rank.',
    fix: 'Expand thin pages with comprehensive coverage of the topic — aim for 300+ words of unique, useful content.'
  }
};

function renderReport(r) {
  lastReport = r;
  document.getElementById('result-url').textContent = r.url;

  const score = Math.round(r.score);
  const ring = document.getElementById('score-ring');
  const circumference = 326.73;
  const offset = circumference - (score / 100) * circumference;
  ring.style.strokeDashoffset = offset;

  if (score >= 80) ring.style.stroke = '#10b981';
  else if (score >= 60) ring.style.stroke = '#f59e0b';
  else if (score >= 40) ring.style.stroke = '#f97316';
  else ring.style.stroke = '#ef4444';

  animateCounter('score-num', score);
  animateCounter('passed-tests', r.passedTests || 0);
  animateCounter('total-issues', r.totalIssues || 0);
  animateCounter('major-issues', r.issuesList.filter(i => i.toLowerCase().includes('miss') || i.toLowerCase().includes('lack') || i.toLowerCase().includes('not found') || i.toLowerCase().includes('no ')).length);
  animateCounter('moderate-issues', Math.floor((r.totalIssues || 0) / 3));
  animateCounter('minor-issues', Math.floor((r.totalIssues || 0) / 2));

  renderChecks(r);
  renderIssues(r);
}

function animateCounter(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const duration = 800;
  const start = performance.now();

  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(0 + (target - 0) * (1 - Math.pow(1 - progress, 3)));
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function renderChecks(r) {
  const grid = document.getElementById('checks-grid');
  const checks = [
    { label: 'SSL / HTTPS', pass: r.isHttps },
    { label: 'Title Tag', pass: r.titleLength >= 30 && r.titleLength <= 60, value: r.title ? r.title.substring(0, 40) + '…' : '' },
    { label: 'Meta Description', pass: r.metaDescLength >= 50 && r.metaDescLength <= 160 },
    { label: 'Favicon', pass: r.hasFavicon },
    { label: 'Canonical Tag', pass: !!r.canonical?.present },
    { label: 'Open Graph', pass: (r.openGraph?.count || 0) > 0 },
    { label: 'H1 Heading', pass: (r.headings?.h1Count || 0) >= 1 },
    { label: 'Word Count', pass: (r.wordCount || 0) >= 300, value: (r.wordCount || 0) + ' words' },
    { label: 'Text/HTML Ratio', pass: (r.textToHtmlRatio || 0) > 10, value: r.textToHtmlRatio + '%' },
    { label: 'Noindex Tag', pass: !r.technical?.noindex },
  ];

  grid.innerHTML = checks.map(c => {
    let icon, cls;
    if (c.pass) { icon = '&#10003;'; cls = 'pass'; }
    else { icon = '&#10007;'; cls = 'fail'; }
    return `
      <div class="check-item">
        <span class="check-icon ${cls}">${icon}</span>
        <span class="check-label">${c.label}</span>
        ${c.value ? `<span class="check-value">${c.value}</span>` : ''}
      </div>
    `;
  }).join('');
}

function renderIssues(r) {
  const container = document.getElementById('issues-list');

  if (!r.issuesList || r.issuesList.length === 0) {
    container.innerHTML = '<p style="color:var(--green);font-size:0.9rem;">No issues found! Your page looks great.</p>';
    return;
  }

  function matchGuide(issueText) {
    const lower = issueText.toLowerCase();
    for (const [key, guide] of Object.entries(seoGuides)) {
      if (lower.includes(key)) return guide;
    }
    return null;
  }

  const items = r.issuesList.map(issue => {
    const guide = matchGuide(issue);
    const details = guide
      ? `<div class="issue-details" hidden><p class="issue-why"><strong>Why it matters:</strong> ${guide.why}</p><p class="issue-fix"><strong>How to fix:</strong> ${guide.fix}</p></div>
         <button class="issue-toggle" onclick="this.previousElementSibling.hidden = !this.previousElementSibling.hidden; this.textContent = this.previousElementSibling.hidden ? 'Show guide' : 'Hide guide'">Show guide</button>`
      : '';
    return `<div class="issue-item"><span class="issue-tag">${issue}</span>${details}</div>`;
  }).join('');

  const html = `
    <div class="issue-category">
      <h4>All Issues <span class="badge major-badge">${r.issuesList.length}</span></h4>
      <div class="issue-items">${items}</div>
    </div>
  `;

  container.innerHTML = html;
}

function resetForm() {
  resultsSection.hidden = true;
  errorBox.hidden = true;
  results.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// -- Download PDF --
const pdfBtn = document.getElementById('download-pdf');
pdfBtn.addEventListener('click', () => {
  if (!lastReport) return;
  pdfBtn.disabled = true;
  pdfBtn.textContent = 'Generating PDF...';
  const r = lastReport;
  const score = Math.round(r.score);
  const passed = r.passedTests || 0;
  const issues = r.totalIssues || 0;

  function matchGuide(issueText) {
    const lower = issueText.toLowerCase();
    for (const [key, guide] of Object.entries(seoGuides)) {
      if (lower.includes(key)) return guide;
    }
    return null;
  }

  const issuesHtml = (r.issuesList || []).map(issue => {
    const guide = matchGuide(issue);
    const extra = guide
      ? `<div style="margin:6px 0 0 0;padding:10px 12px;background:#f8f6ff;border-left:3px solid #6c5ce7;border-radius:4px;">
          <p style="margin:0 0 4px;font-size:12px;color:#444;line-height:1.5;"><strong>Why it matters:</strong> ${guide.why}</p>
          <p style="margin:0;font-size:12px;color:#444;line-height:1.5;"><strong>How to fix:</strong> ${guide.fix}</p>
         </div>`
      : '';
    return `<li style="margin-bottom:14px;font-size:13px;color:#333;line-height:1.5;">${issue}${extra}</li>`;
  }).join('');

  const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444';

  const issuesList = (r.issuesList || []).map(issue => {
    const guide = matchGuide(issue);
    const extra = guide
      ? `<div style="margin:6px 0 0;padding:8px 10px;background:#f8f6ff;border-left:3px solid #6c5ce7;"><p style="margin:0 0 3px;font-size:11px;color:#555;"><strong>Why:</strong> ${guide.why}</p><p style="margin:0;font-size:11px;color:#555;"><strong>Fix:</strong> ${guide.fix}</p></div>`
      : '';
    return `<li style="margin-bottom:10px;font-size:12px;color:#333;">${issue}${extra}</li>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>SEO Audit - ${r.host}</title>
<style>
  @page { margin: 0.5in; }
  body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; color: #222; padding: 0; margin: 0; }
  .page { max-width: 700px; margin: 0 auto; padding: 20px; }
  .header { text-align: center; padding: 20px; background: linear-gradient(135deg,#6c5ce7,#8b5cf6); border-radius: 8px; color: #fff; margin-bottom: 20px; }
  .header h1 { margin: 0; font-size: 20px; }
  .header p { margin: 4px 0 0; font-size: 13px; opacity: 0.85; }
  .score { text-align: center; margin-bottom: 16px; }
  .score .num { font-size: 36px; font-weight: 700; color: ${scoreColor}; }
  .score .grade { font-size: 12px; color: #999; }
  .stats { display: flex; gap: 12px; margin-bottom: 20px; }
  .stats div { flex: 1; text-align: center; padding: 10px; border-radius: 6px; font-size: 12px; }
  .stats .pass { background: #f0fdf4; border: 1px solid #d1fae5; }
  .stats .fail { background: #fef2f2; border: 1px solid #fecaca; }
  .stats .num { display: block; font-size: 18px; font-weight: 700; }
  h2 { font-size: 14px; margin: 20px 0 10px; padding-bottom: 4px; border-bottom: 2px solid #6c5ce7; }
  ul { padding-left: 18px; }
  li { margin-bottom: 10px; }
  .footer { margin-top: 24px; padding: 12px; background: #f9fafb; text-align: center; font-size: 11px; color: #999; border-radius: 6px; border: 1px solid #e5e7eb; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>
<div class="page">
  <div class="header"><h1>SEO Audit Report</h1><p>${r.url}</p></div>
  <div class="score"><span class="num">${score}/100</span><div class="grade">Grade: ${r.grade}</div></div>
  <div class="stats">
    <div class="pass"><span class="num">${passed}</span>Tests Passed</div>
    <div class="fail"><span class="num">${issues}</span>Issues Found</div>
  </div>
  <h2>Issues &amp; Fix Guides</h2>
  ${issuesList ? `<ul>${issuesList}</ul>` : '<p style="color:#10b981;">No issues found!</p>'}
  <div class="footer">Powered by <a href="https://1st-page-ranking.com" style="color:#6c5ce7;text-decoration:none;">1st-page-ranking</a> &mdash; ${new Date().getFullYear()}</div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print()},500)}<\/script>
</body></html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  const checkClosed = setInterval(() => {
    if (w.closed) {
      clearInterval(checkClosed);
      pdfBtn.disabled = false;
      pdfBtn.textContent = '\u{1F4C4} Download PDF Report';
    }
  }, 500);
});



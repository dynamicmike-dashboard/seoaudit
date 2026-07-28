document.getElementById('footer-year').textContent = new Date().getFullYear();

// -- Tech background canvas animation --
(function initTechBg() {
  const canvas = document.getElementById('tech-bg');
  const ctx = canvas.getContext('2d');
  let w, h, particles = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function createParticles(count) {
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.5,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(108,92,231,${1 - dist / 150})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = '#6c5ce7';
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  resize();
  createParticles(80);
  draw();
  window.addEventListener('resize', () => { resize(); createParticles(80); });
})();

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

  const html = `
    <div class="issue-category">
      <h4>All Issues <span class="badge major-badge">${r.issuesList.length}</span></h4>
      <div class="issue-items">
        ${r.issuesList.map(i => `<span class="issue-tag">${i}</span>`).join('')}
      </div>
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

// -- Download Report --
document.getElementById('download-pdf').addEventListener('click', () => {
  if (!lastReport) return;
  const r = lastReport;
  const score = Math.round(r.score);
  const passed = r.passedTests || 0;
  const issues = r.totalIssues || 0;
  const issuesHtml = (r.issuesList || []).map(i => `<li>${i}</li>`).join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>SEO Audit Report</title>
<style>
  body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; max-width: 700px; margin: 2rem auto; padding: 0 1rem; color: #222; }
  h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
  .url { color: #666; font-size: 0.9rem; margin-bottom: 1.5rem; }
  .score-box { background: #f5f3ff; border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; }
  .score-box strong { font-size: 2rem; color: #6c5ce7; }
  .grid { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
  .grid div { flex: 1; background: #fafafa; border: 1px solid #eee; border-radius: 6px; padding: 0.75rem; text-align: center; }
  .grid div span { display: block; font-size: 1.25rem; font-weight: 700; }
  h2 { font-size: 1.1rem; margin: 1rem 0 0.5rem; }
  ul { padding-left: 1.25rem; color: #444; }
  li { margin-bottom: 0.35rem; }
  .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #eee; font-size: 0.8rem; color: #999; text-align: center; }
  .cta { display: block; text-align: center; margin-top: 1.5rem; padding: 0.75rem; background: linear-gradient(135deg,#6c5ce7,#8b5cf6); color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600; }
</style></head><body>
  <h1>SEO Audit Report</h1>
  <p class="url">${r.url}</p>
  <div class="score-box">Overall Score: <strong>${score}/100</strong></div>
  <div class="grid">
    <div><span>${passed}</span>Tests Passed</div>
    <div><span>${issues}</span>Issues Found</div>
  </div>
  <h2>Issues</h2>
  ${issuesHtml ? `<ul>${issuesHtml}</ul>` : '<p>No issues found.</p>'}
  <a class="cta" href="https://1st-page-ranking.com" target="_blank">Optimise your site for ChatGPT, Claude, Perplexity, Google &rarr;</a>
  <div class="footer">Powered by <a href="https://1st-page-ranking.com" style="color:#6c5ce7;">1st-page-ranking</a> &mdash; ${new Date().getFullYear()}</div>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `seo-audit-${r.url.replace(/https?:\/\//,'').replace(/[\/.]/g,'-')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
});



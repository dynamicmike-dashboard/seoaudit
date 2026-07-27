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

function renderReport(r) {
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

/* ============================================================
   Jhoot Detector — script.js
   Vanilla JS handling all UI interactions, API calls, and
   dynamic rendering with XSS-safe HTML escaping.
   ============================================================ */

// ---------------------------------------------------------------------------
// XSS Protection — escape all AI-returned text before DOM insertion
// ---------------------------------------------------------------------------
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ---------------------------------------------------------------------------
// Sample Posts Data (identical to src/data/samples.ts)
// ---------------------------------------------------------------------------
const SAMPLE_POSTS = [
  {
    id: 'high-risk',
    title: 'High Risk Scam',
    tag: 'Easypaisa Upfront Fee Scam',
    riskHint: 'HIGH',
    text: `🔥 URGENT HIRING: WORK FROM HOME OPPORTUNITY! 🔥
Earn PKR 80,000 to 120,000 per month! 💰
No qualifications or prior experience needed. Just 2-3 hours daily on your smartphone or laptop.

Post: Online Data Entry & SMS Processing Executive
Requirements:
- Age: 18+
- Male / Female both can apply
- Daily payments via Easypaisa or JazzCash

⚠️ ATTENTION: Only 3 seats left today! Immediate joining without any interview.
To activate your portal account and receive initial test training material, please pay a one-time refundable security/registration fee of PKR 2,500 via Easypaisa to account 0345-XXXXXXX. 

Send transaction screenshot to: jobs.careerpakistan2026@gmail.com or WhatsApp 0312-XXXXXXX. Hurry up!`
  },
  {
    id: 'medium-risk',
    title: 'Medium Risk Post',
    tag: 'Unverified Firm & CNIC Demand',
    riskHint: 'MEDIUM',
    text: `Hiring Alert: Customer Service Executive (Remote/Karachi)
Company: Prime Solutions Global PK
Salary: PKR 85,000 - 95,000 / month (Above industry standard)

Responsibilities:
- Handling inbound customer calls and email queries
- Maintaining client database

Requirements:
- Good English communication skills
- Intermediate / Bachelors

How to Apply:
Please send your CV along with clear scanned copies of your CNIC (front & back) and recent photograph immediately to hr.primesolutions@outlook.com or WhatsApp at 0321-XXXXXXX. Selected candidates will be assigned shifts directly.`
  },
  {
    id: 'low-risk',
    title: 'Low Risk Verified',
    tag: 'Legitimate Corporate Posting',
    riskHint: 'LOW',
    text: `Position: Associate Software Quality Assurance Engineer
Company: TechCorp Pakistan (Pvt.) Ltd.
Location: Gulberg III, Lahore / Hybrid

Job Description:
TechCorp Pakistan is looking for an Associate SQA Engineer to join our core fintech development team.

Responsibilities:
- Create comprehensive test plans and test cases
- Perform manual API and functional regression testing
- Collaborate with engineering and product managers

Requirements:
- BS in Computer Science or Software Engineering
- 0 to 1 year relevant QA experience / internship
- Solid understanding of SDLC and bug tracking tools (Jira)

Compensation & Benefits:
- PKR 90,000 - 120,000 based on interview evaluation
- Medical insurance (OPD/IPD) + Provident fund + Annual leaves

How to Apply:
Submit your updated resume via our official careers portal at https://careers.techcorp.pk or email recruitment@techcorp.pk with subject "SQA-2026". We never ask for any processing or registration fees at any stage of recruitment.`
  }
];

// ---------------------------------------------------------------------------
// SVG Icon Templates (replacing Lucide-React)
// ---------------------------------------------------------------------------
const ICONS = {
  alertOctagon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  alertTriangle: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  checkCircle: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  alertCircleSmall: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  shieldAlert: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  shieldCheck: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
  checkCircleSmall: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  copy: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  quote: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"/></svg>`,
  info: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
};

// ---------------------------------------------------------------------------
// DOM References
// ---------------------------------------------------------------------------
const textarea = document.getElementById('job-text-input');
const wordCounter = document.getElementById('word-counter');
const analyzeBtn = document.getElementById('analyze-button');
const analyzeBtnText = document.getElementById('analyze-btn-text');
const analyzeIconSearch = document.getElementById('analyze-icon-search');
const analyzeIconSpinner = document.getElementById('analyze-icon-spinner');
const errorBox = document.getElementById('error-box');
const errorText = document.getElementById('error-text');
const clearBtn = document.getElementById('clear-btn');
const pasteBtn = document.getElementById('paste-btn');
const samplesGrid = document.getElementById('samples-grid');
const resultsSection = document.getElementById('analysis-results');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeLabel = document.getElementById('theme-label');

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let selectedSampleId = null;
let isLoading = false;
let currentResult = null;

// ---------------------------------------------------------------------------
// Theme Management
// ---------------------------------------------------------------------------
function getInitialTheme() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

function setTheme(theme) {
  const root = document.documentElement;
  root.classList.remove('dark', 'light');
  root.classList.add(theme);
  themeLabel.textContent = theme === 'dark' ? 'Light' : 'Dark';
}

// Initialize theme
setTheme(getInitialTheme());

themeToggleBtn.addEventListener('click', () => {
  const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  setTheme(current === 'dark' ? 'light' : 'dark');
});

// ---------------------------------------------------------------------------
// Word / Character Counter
// ---------------------------------------------------------------------------
function updateCounter() {
  const text = textarea.value.trim();
  if (text.length > 0) {
    const words = text.split(/\s+/).length;
    wordCounter.textContent = `${words} words · ${textarea.value.length} characters`;
  } else {
    wordCounter.textContent = '0 words';
  }
}

textarea.addEventListener('input', () => {
  updateCounter();
  updateAnalyzeButton();
  updateClearButton();
  // Clear error on input
  if (!errorBox.classList.contains('hidden')) {
    hideError();
  }
});

// ---------------------------------------------------------------------------
// Clear / Paste Buttons
// ---------------------------------------------------------------------------
function updateClearButton() {
  if (textarea.value.length > 0) {
    clearBtn.classList.remove('hidden');
  } else {
    clearBtn.classList.add('hidden');
  }
}

clearBtn.addEventListener('click', () => {
  textarea.value = '';
  selectedSampleId = null;
  currentResult = null;
  updateCounter();
  updateAnalyzeButton();
  updateClearButton();
  hideError();
  hideResults();
  updateSampleHighlights();
  textarea.focus();
});

pasteBtn.addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      textarea.value = text;
      selectedSampleId = null;
      updateCounter();
      updateAnalyzeButton();
      updateClearButton();
      hideError();
      updateSampleHighlights();
    }
  } catch {
    // Clipboard API may be restricted; just focus textarea
    textarea.focus();
  }
});

// ---------------------------------------------------------------------------
// Analyze Button State
// ---------------------------------------------------------------------------
function updateAnalyzeButton() {
  analyzeBtn.disabled = isLoading || !textarea.value.trim();
}

// ---------------------------------------------------------------------------
// Sample Post Buttons
// ---------------------------------------------------------------------------
function renderSampleButtons() {
  samplesGrid.innerHTML = '';
  SAMPLE_POSTS.forEach(sample => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sample-btn';
    btn.dataset.sampleId = sample.id;

    const riskClass = sample.riskHint.toLowerCase();

    btn.innerHTML = `
      <div class="sample-btn-top">
        <span class="sample-btn-title">${escapeHtml(sample.title)}</span>
        <span class="risk-hint-badge ${riskClass}">${escapeHtml(sample.riskHint)}</span>
      </div>
      <p class="sample-btn-tag">${escapeHtml(sample.tag)}</p>
    `;

    btn.addEventListener('click', () => {
      textarea.value = sample.text;
      selectedSampleId = sample.id;
      updateCounter();
      updateAnalyzeButton();
      updateClearButton();
      hideError();
      updateSampleHighlights();
      textarea.focus();
    });

    samplesGrid.appendChild(btn);
  });
}

function updateSampleHighlights() {
  document.querySelectorAll('.sample-btn').forEach(btn => {
    if (btn.dataset.sampleId === selectedSampleId) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });
}

// ---------------------------------------------------------------------------
// Error Display
// ---------------------------------------------------------------------------
function showError(msg) {
  errorText.textContent = msg;
  errorBox.classList.remove('hidden');
}

function hideError() {
  errorBox.classList.add('hidden');
  errorText.textContent = '';
}

// ---------------------------------------------------------------------------
// Loading State
// ---------------------------------------------------------------------------
function setLoading(loading) {
  isLoading = loading;
  updateAnalyzeButton();

  if (loading) {
    analyzeIconSearch.classList.add('hidden');
    analyzeIconSpinner.classList.remove('hidden');
    analyzeBtnText.textContent = 'Scanning for Jhooṭ & Red Flags...';
  } else {
    analyzeIconSearch.classList.remove('hidden');
    analyzeIconSpinner.classList.add('hidden');
    analyzeBtnText.textContent = 'Analyze Job Post';
  }
}

// ---------------------------------------------------------------------------
// Analyze API Call
// ---------------------------------------------------------------------------
async function handleAnalyze() {
  const text = textarea.value;

  if (!text || text.trim().length === 0) {
    showError('Please paste a job posting or select one of the sample posts below.');
    textarea.focus();
    return;
  }

  if (text.trim().length < 15) {
    showError('The job post text is too short. Please paste the full job posting description.');
    return;
  }

  setLoading(true);
  hideError();

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      let errMsg = `Server responded with status ${response.status}`;
      try {
        const errData = await response.json();
        if (errData.error) errMsg = errData.error;
      } catch { /* ignore parse error */ }
      throw new Error(errMsg);
    }

    const data = await response.json();
    currentResult = data;
    renderResults(data);

    // Smooth scroll to results
    setTimeout(() => {
      resultsSection.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  } catch (err) {
    console.error('Analysis failed:', err);
    showError(err.message || 'Could not analyze the job posting. Please check your connection and try again.');
  } finally {
    setLoading(false);
  }
}

analyzeBtn.addEventListener('click', handleAnalyze);

// Ctrl+Enter shortcut
textarea.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    handleAnalyze();
  }
});

// ---------------------------------------------------------------------------
// Results Rendering (XSS-safe)
// ---------------------------------------------------------------------------
function hideResults() {
  resultsSection.classList.add('hidden');
  resultsSection.innerHTML = '';
}

function renderResults(result) {
  const riskLevel = result.risk_level; // HIGH, MEDIUM, LOW
  const riskClass = riskLevel.toLowerCase();

  // Risk badge content
  let badgeIcon, badgeLabel;
  if (riskLevel === 'HIGH') {
    badgeIcon = ICONS.alertOctagon;
    badgeLabel = 'HIGH RISK (خطرناک فراڈ)';
  } else if (riskLevel === 'MEDIUM') {
    badgeIcon = ICONS.alertTriangle;
    badgeLabel = 'MEDIUM RISK (مشتبہ اشتہار)';
  } else {
    badgeIcon = ICONS.checkCircle;
    badgeLabel = 'LOW RISK (محفوظ / جائز)';
  }

  // Flags HTML
  let flagsHtml = '';
  if (result.flags && result.flags.length > 0) {
    const flagIconClass = riskLevel === 'HIGH' ? 'icon-high' : 'icon-medium';
    const flagCardClass = riskLevel === 'HIGH' ? 'flag-high' : 'flag-medium';
    const flagHeaderIcon = riskLevel === 'HIGH'
      ? `<span style="color:var(--rose-400)">${ICONS.shieldAlert}</span>`
      : `<span style="color:var(--amber-400)">${ICONS.shieldAlert}</span>`;

    let flagCardsHtml = result.flags.map(flag => {
      const detailHtml = flag.detail
        ? `<div class="flag-detail">
            <span class="flag-detail-quote-icon">${ICONS.quote}</span>
            <span class="flag-detail-text">"${escapeHtml(flag.detail)}"</span>
          </div>`
        : '';

      return `
        <div class="flag-card ${flagCardClass}">
          <div class="flag-card-inner">
            <div class="flag-icon-box">
              <span class="${flagIconClass}">${ICONS.alertCircleSmall}</span>
            </div>
            <div class="flag-content">
              <div class="flag-issue">${escapeHtml(flag.issue)}</div>
              ${detailHtml}
              <p class="flag-explanation">
                <strong>Why it's suspicious: </strong>${escapeHtml(flag.explanation)}
              </p>
            </div>
          </div>
        </div>
      `;
    }).join('');

    flagsHtml = `
      <div class="flags-section">
        <div class="flags-header">
          <div class="flags-header-left">
            ${flagHeaderIcon}
            <h4 class="flags-title">Identified Red Flags (${result.flags.length})</h4>
          </div>
          <span class="flags-subtitle">Suspicious patterns detected</span>
        </div>
        <div class="flags-list">
          ${flagCardsHtml}
        </div>
      </div>
    `;
  }

  // Legitimate signals HTML
  let legitHtml = '';
  if (result.legitimate_signals && result.legitimate_signals.length > 0) {
    const legitTitle = riskLevel === 'LOW'
      ? 'What Made This Look Legitimate'
      : 'Legitimate / Positive Signals Observed';

    const signalItems = result.legitimate_signals.map(signal => `
      <div class="legit-item">
        ${ICONS.checkCircleSmall}
        <span>${escapeHtml(signal)}</span>
      </div>
    `).join('');

    legitHtml = `
      <div class="legit-section">
        <div class="legit-header">
          <span class="icon-emerald">${ICONS.shieldCheck}</span>
          <h4 class="legit-title">${escapeHtml(legitTitle)}</h4>
        </div>
        <div class="legit-list">
          ${signalItems}
        </div>
      </div>
    `;
  }

  // Full results HTML
  const html = `
    <div class="results-container risk-${riskClass}">
      <!-- Verdict Bar -->
      <div class="verdict-bar">
        <div class="risk-badge ${riskClass}">
          <div class="risk-badge-icon">${badgeIcon}</div>
          <div>
            <span class="risk-badge-label-small">Overall Assessment</span>
            <span class="risk-badge-label-large">${escapeHtml(badgeLabel)}</span>
          </div>
        </div>

        <div class="verdict-actions">
          <button type="button" class="btn-action" id="copy-report-btn" title="Copy analysis summary to clipboard">
            <span id="copy-icon-area">${ICONS.copy}</span>
            <span id="copy-btn-label">Copy Report</span>
          </button>
          <button type="button" class="btn-action" id="analyze-another-btn">
            Analyze Another
          </button>
        </div>
      </div>

      <!-- Verdict Summary -->
      <div class="verdict-summary">
        <div class="verdict-summary-label">Verdict Summary</div>
        <p class="verdict-summary-text">${escapeHtml(result.summary)}</p>
      </div>

      ${flagsHtml}
      ${legitHtml}

      <!-- Golden Rule -->
      <div class="golden-rule">
        <span class="icon-emerald">${ICONS.info}</span>
        <span>
          <strong>Golden Rule:</strong> Real Pakistani employers never demand fees via Easypaisa/JazzCash or ask for CNIC copies before formal interviews.
        </span>
      </div>
    </div>
  `;

  resultsSection.innerHTML = html;
  resultsSection.classList.remove('hidden');

  // Attach event listeners to dynamically created buttons
  const copyBtn = document.getElementById('copy-report-btn');
  const analyzeAnotherBtn = document.getElementById('analyze-another-btn');

  if (copyBtn) {
    copyBtn.addEventListener('click', handleCopyReport);
  }

  if (analyzeAnotherBtn) {
    analyzeAnotherBtn.addEventListener('click', () => {
      textarea.value = '';
      selectedSampleId = null;
      currentResult = null;
      updateCounter();
      updateAnalyzeButton();
      updateClearButton();
      hideError();
      hideResults();
      updateSampleHighlights();
      textarea.focus();
    });
  }
}

// ---------------------------------------------------------------------------
// Copy Report (Clipboard API)
// ---------------------------------------------------------------------------
function handleCopyReport() {
  if (!currentResult) return;

  const result = currentResult;

  const flagsText = result.flags && result.flags.length > 0
    ? result.flags.map((f, i) => `${i + 1}. [${f.issue}] "${f.detail}" -> ${f.explanation}`).join('\n')
    : 'No significant red flags detected.';

  const legText = result.legitimate_signals && result.legitimate_signals.length > 0
    ? '\n\nLegitimate Signals:\n' + result.legitimate_signals.map(s => `- ${s}`).join('\n')
    : '';

  const textToCopy = `🕵️ Jhoot Detector Scam Analysis Report
━━━━━━━━━━━━━━━━━━━━
Risk Verdict: ${result.risk_level} RISK
Summary: ${result.summary}

Red Flags Found (${result.flags.length}):
${flagsText}${legText}

Analyzed via Jhoot Detector - Pakistani Job Scam Post Analyzer`;

  navigator.clipboard.writeText(textToCopy).then(() => {
    const copyIconArea = document.getElementById('copy-icon-area');
    const copyBtnLabel = document.getElementById('copy-btn-label');

    if (copyIconArea && copyBtnLabel) {
      copyIconArea.innerHTML = ICONS.check;
      copyBtnLabel.innerHTML = '<span class="copied-text">Copied!</span>';

      setTimeout(() => {
        copyIconArea.innerHTML = ICONS.copy;
        copyBtnLabel.textContent = 'Copy Report';
      }, 2000);
    }
  }).catch(() => {
    // Clipboard write failed silently
  });
}

// ---------------------------------------------------------------------------
// Initialize
// ---------------------------------------------------------------------------
renderSampleButtons();
updateCounter();
updateAnalyzeButton();
updateClearButton();

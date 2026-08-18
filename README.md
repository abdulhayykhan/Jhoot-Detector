# Jhoot Detector 🕵️ — Pakistani Job Scam Analyzer

> An AI-powered scam analysis tool that evaluates job postings from Pakistani social media groups and job boards to detect recruitment fraud, upfront fee extortion, and identity theft traps.

---

## 📌 Problem Statement

Recruitment fraud in Pakistan has become an pervasive issue, directly targeting students, recent graduates, and unemployed job seekers. Scammers actively exploit unmoderated communication channels—predominantly WhatsApp broadcast groups, Facebook community job boards, OLX classifieds, Telegram channels, and informal listings on platforms like Rozee.pk and LinkedIn Pakistan.

These fraudulent schemes typically operate through several recurring patterns:

1. **Advance-Fee Fraud & Payment Extortion:** Scammers advertise attractive remote positions (e.g., online data entry, SMS processing, or form filling) offering PKR 60,000–120,000/month for minimal effort. After initial contact, candidates are instructed to transfer an upfront "registration fee," "security deposit," "portal activation charge," or "training module fee" (typically PKR 1,500–5,000) via mobile wallets such as Easypaisa or JazzCash. Once the funds are transferred, the recruiter disappears.
2. **CNIC & Identity Harvesting:** Unverified entities solicit high-resolution front and back copies of Computerized National Identity Cards (CNIC), residential addresses, utility bills, and personal photographs prior to conducting any formal interview, skill assessment, or contract issuance. This collected data is frequently exploited for illegal biometric SIM registrations, unauthorized digital wallet creation, or identity theft.
3. **Corporate Impersonation & Fake Freelance Portals:** Fraudulent operators masquerade as well-known multinational enterprises or local IT firms while communicating exclusively through free email domains (`@gmail.com`, `@yahoo.com`, `@outlook.com`) and unverified WhatsApp numbers without a verifiable business domain or corporate presence.

Manual detection is challenging for job seekers who may lack formal corporate exposure or are compelled by economic pressure. **Jhoot Detector** provides instant, objective heuristic evaluation of suspicious job text to highlight red flags before candidates commit money or share sensitive credentials.

---

## 🏗️ System Architecture

Jhoot Detector is built on a full-stack architecture combining a vanilla HTML/CSS/JS frontend with a Python Flask API backend:

```
┌──────────────────────────────────────────────────────────────────┐
│                          Frontend Client                         │
│   (Vanilla HTML5 + CSS3 + JavaScript + Dark/Light Mode)          │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ POST /api/analyze
                                  │ { text: string }
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Python Flask Backend                         │
│                          (app.py)                                │
│  - Payload sanitization & minimum length validation (> 15 chars) │
│  - System instruction formatting with Pakistani scam heuristics │
│  - JSON response mode enforcement                                │
│  - XSS-safe: all AI text escaped before DOM insertion            │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ HTTPS POST (OpenAI-compatible)
                                  │ Authorization: Bearer GROQ_API_KEY
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                        Groq Cloud API                            │
│           Model: openai/gpt-oss-120b (Temp: 0.3)                 │
│            (Fallback: openai/gpt-oss-20b on 404)                 │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ Structured JSON Output
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                         UI Rendering                             │
│   - Risk Badge: HIGH RISK (Crimson) / MEDIUM (Amber) / LOW (Emerald)
│   - Summary Verdict                                              │
│   - Flagged Cards (Quoted phrases + Contextual reasoning)        │
│   - Legitimate Signals (Positive confidence indicators)          │
└──────────────────────────────────────────────────────────────────┘
```

### 1. Frontend Architecture
- **Stack:** Vanilla HTML5, CSS3 (with CSS Custom Properties), JavaScript (ES6+).
- **Styling & Theming:** Hand-written CSS with an adaptive light and dark mode engine (system `prefers-color-scheme` detection, toggle button).
- **Component Structure:**
  - Header: Branding, application status, and theme toggle.
  - Risk Badge: High-contrast visual indicator rendering `HIGH RISK`, `MEDIUM RISK`, or `LOW RISK` with Urdu subtitles and icon states.
  - Analysis Results: Primary verdict display containing the single-sentence summary, itemized red-flag cards (with extracted quotes and risk explanations), and positive confidence signals.
  - Sample Post Cards: One-click benchmark postings enabling instant demonstration across various risk tiers.
- **XSS Protection:** All AI-returned text is HTML-escaped before DOM insertion via a dedicated `escapeHtml()` utility.

### 2. Backend Architecture
- **Framework:** Python Flask serving both the static frontend and a REST API endpoint.
- **Payload Validation:** Enforces request method boundaries (`POST`), validates input string presence, and guards against empty or sub-15-character inputs.
- **Error Handling:** Catches Groq API errors (rate limits, 5xx, timeouts) and returns clean JSON error responses.

### 3. LLM Integration
- **Inference Engine:** [Groq Cloud](https://groq.com/) API running **GPT-OSS 120B** (`openai/gpt-oss-120b`).
- **Endpoint Protocol:** Uses Groq's OpenAI-compatible chat completions endpoint (`https://api.groq.com/openai/v1/chat/completions`) via Python `requests`.
- **Temperature Configuration:** Configured with a low temperature (`0.3`) to prioritize deterministic reasoning, factual consistency, and strict JSON output compliance over creative variance.
- **Model Fallback:** Includes automated fallback handling to `openai/gpt-oss-20b` in the event of primary model maintenance or temporary unavailability.

---

## 🔍 Scam Detection Methodology

> **Note on Model Implementation:** Jhoot Detector uses a carefully designed zero-shot prompt with domain-specific Pakistani recruitment fraud heuristics. It is an instructed LLM pipeline, not a fine-tuned model.

### 1. Evaluated Red-Flag Categories

The system prompt evaluates incoming posting text against seven distinct fraud vectors:

| Red-Flag Category | Description & Pakistani Market Context |
| :--- | :--- |
| **Upfront Fee Demands** | Requests for "registration fees," "portal activation charges," "training fees," or "refundable security deposits" via Easypaisa, JazzCash, or bank transfer prior to hiring. |
| **Generic & Unverifiable Identity** | Absence of a legitimate corporate website; reliance on free public email providers (`@gmail.com`, `@yahoo.com`, `@outlook.com`) for corporate recruitment communications. |
| **Unrealistic Compensation Ratios** | Salaries disproportionate to skill requirements (e.g., PKR 80,000–120,000/month for 2–3 hours/day of basic typing or SMS sending with zero experience). |
| **Urgency & Pressure Tactics** | High-pressure phrases designed to prevent critical evaluation (e.g., *"Only 3 seats remaining today,"* *"Immediate joining without interview,"* *"First 10 applicants only"*). |
| **Premature Data Harvesting** | Requests for front and back scans of CNIC cards, banking credentials, OTPs, or sensitive documents prior to an interview or formal written offer. |
| **Vague Scope & Empty Promises** | Listings lacking job responsibilities, role requirements, or company details, focusing solely on guaranteed earnings and flexible hours. |
| **Spam Formatting Patterns** | Heavy emoji clutter, excessive exclamation marks, broken grammar, and informal styling inconsistent with professional corporate recruiting. |

### 2. Structured JSON Output Schema

To guarantee reliable rendering, inference is locked to JSON mode using `response_format: { type: "json_object" }`. The model returns data in this structure:

```json
{
  "risk_level": "LOW | MEDIUM | HIGH",
  "summary": "one sentence verdict",
  "flags": [
    {
      "issue": "short label",
      "detail": "the specific phrase or detail",
      "explanation": "why it's suspicious"
    }
  ],
  "legitimate_signals": ["list of things that looked okay, only if risk is LOW or MEDIUM"]
}
```

---

## 🛠️ Tech Stack

| Layer | Technologies & Dependencies |
| :--- | :--- |
| **Frontend** | Vanilla HTML5, CSS3 (CSS Custom Properties), JavaScript (ES6+) |
| **Backend** | [Python Flask](https://flask.palletsprojects.com/) (`3.1.1`) |
| **HTTP Client** | [Requests](https://docs.python-requests.org/) (`2.32.3`) |
| **Environment** | [python-dotenv](https://github.com/theskumar/python-dotenv) (`1.1.0`) |
| **CORS** | [Flask-CORS](https://flask-cors.readthedocs.io/) (`5.0.1`) |
| **Production Server** | [Gunicorn](https://gunicorn.org/) (`23.0.0`) |
| **Inference API** | [Groq Cloud](https://console.groq.com/) (`openai/gpt-oss-120b`) |

---

## 🚀 Setup & Local Development

### Prerequisites
- **Python:** 3.9 or higher
- **pip:** Latest version
- **Groq API Key:** Obtainable for free at [Groq Console](https://console.groq.com/keys)

### Step-by-Step Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/abdulhayykhan/Jhoot-Detector.git
   cd Jhoot-Detector
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   Create a `.env` file in the project root based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Add your Groq Cloud API key to `.env`:
   ```env
   GROQ_API_KEY=gsk_your_actual_groq_api_key_here
   ```

5. **Start the local development server:**
   ```bash
   flask run
   ```
   Open your browser and navigate to `http://localhost:3000`.

   Or run directly:
   ```bash
   python app.py
   ```

---

## ☁️ Deployment

### Option 1: Vercel (Configured via `vercel.json`)

The project is pre-configured with `vercel.json` for Vercel's Python Serverless Runtime (`@vercel/python`).

1. **Push your code to GitHub:**
   ```bash
   git push origin main
   ```
2. **Import into Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/new) and import your repository.
3. **Configure Environment Variables (CRITICAL):**
   - Under **Project Settings > Environment Variables**, add:
     - **Key:** `GROQ_API_KEY`
     - **Value:** `gsk_your_groq_api_key_here`
   - *Note:* Environment variables in Vercel's dashboard are separate from your local `.env` file.
4. **Deploy:** Click **Deploy**. Vercel will install dependencies from `requirements.txt` and route all frontend requests and `/api/analyze` to the Flask WSGI handler.

---

### Alternative Platforms (Persistent WSGI)

#### Option 2: Render.com (Free Web Service)

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/) → **New** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
   - **Environment Variables:** Add `GROQ_API_KEY`
5. Deploy — Render will auto-deploy on every push

#### Option 3: Railway.app

1. Go to [Railway](https://railway.app/) → **New Project** → **Deploy from GitHub**
2. Connect your repository
3. Add environment variable: `GROQ_API_KEY`
4. Railway auto-detects Python and deploys with gunicorn

### Production Command
```bash
gunicorn app:app --bind 0.0.0.0:$PORT
```

---

## ⚠️ Limitations & Disclaimer

- **Heuristic AI Tool:** Jhoot Detector utilizes an LLM prompted against common fraud indicators. It does not perform active database lookups against the Securities and Exchange Commission of Pakistan (SECP), Pakistan Software Export Board (PSEB), or Federal Board of Revenue (FBR) corporate registries.
- **Potential for False Positives & Negatives:**
  - *False Positives:* Authentic micro-businesses or local shops utilizing standard Gmail accounts or urgent hiring language may receive caution flags.
  - *False Negatives:* Sophisticated fraudulent operations that mimic legitimate corporate formatting and withhold fee demands until private WhatsApp or phone conversations may receive lower initial risk ratings.
- **Independent Due Diligence:** This tool is an informational aid. Job seekers should independently verify companies, never transfer money to secure employment, and never disclose banking details or OTPs to unverified recruiters.

---

## 🏆 Hackathon Context

Built within a 2-hour rapid development sprint for Chai Aur Code by GDG Live Pakistan, focusing on practical AI utility tools that address everyday challenges faced by Pakistani youth.

---

## 📄 License

This project is open-source and available for educational and commercial use under the MIT License.

---

**Made with ❤️ by [Abdul Hayy Khan](https://www.linkedin.com/in/abdulhayykhan/)**

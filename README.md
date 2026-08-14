# Jhoot Detector 🕵️ — Pakistani Job Scam Analyzer

> An AI-powered scam analysis tool that evaluates job postings from Pakistani social media groups and job boards to detect recruitment fraud, upfront fee extortion, and identity theft traps.

🌐 **Live Demo:** [https://jhoot-detector.vercel.app/](https://jhoot-detector.vercel.app/)

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

Jhoot Detector is built on a full-stack architecture combining a reactive client-side interface with a stateless serverless inference pipeline:

```
┌──────────────────────────────────────────────────────────────────┐
│                          Frontend Client                         │
│   (React 19 + TypeScript + Vite + Tailwind CSS v4 + Dark Mode)   │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ POST /api/analyze
                                  │ { text: string }
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Vercel Serverless Function                     │
│                       (/api/analyze.ts)                          │
│  - Payload sanitization & minimum length validation (> 15 chars) │
│  - System instruction formatting with Pakistani scam heuristics │
│  - JSON response mode enforcement                                │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ HTTPS POST (OpenAI-compatible)
                                  │ Authorization: Bearer GROQ_API_KEY
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                        Groq Cloud API                            │
│           Model: llama-3.3-70b-versatile (Temp: 0.3)             │
│            (Fallback: llama-3.1-8b-instant on 404)               │
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
- **Framework:** React 19 with TypeScript, bundled using Vite.
- **Styling & Theming:** Tailwind CSS v4 with an adaptive light and dark mode engine (in-memory state with system `prefers-color-scheme` detection).
- **Component Structure:**
  - `Header`: Branding, application status, and theme toggle.
  - `RiskBadge`: High-contrast visual indicator rendering `HIGH RISK`, `MEDIUM RISK`, or `LOW RISK` with icon states.
  - `AnalysisResults`: Primary verdict display containing the single-sentence summary, itemized red-flag cards (with extracted quotes and risk explanations), and positive confidence signals.
  - `Sample Post Cards`: One-click benchmark postings enabling instant demonstration across various risk tiers.

### 2. Backend & Serverless Pipeline
- **Serverless Architecture:** The production backend runs as a stateless Vercel Serverless Function (`api/analyze.ts`). It handles HTTP requests without maintaining a persistent server process, optimizing cold starts and auto-scaling.
- **Local Dev Server:** In local development, an Express entry point (`server.ts`) wraps the identical handler and integrates Vite middleware.
- **Payload Validation:** Enforces request method boundaries (`POST`), validates input string presence, and guards against empty or sub-15-character inputs.

### 3. LLM Integration
- **Inference Engine:** [Groq Cloud](https://groq.com/) API running **Llama 3.3 70B** (`llama-3.3-70b-versatile`).
- **Endpoint Protocol:** Uses Groq's OpenAI-compatible chat completions endpoint (`https://api.groq.com/openai/v1/chat/completions`) via native `fetch`.
- **Temperature Configuration:** Configured with a low temperature (`0.3`) to prioritize deterministic reasoning, factual consistency, and strict JSON output compliance over creative variance.
- **Model Fallback:** Includes automated fallback handling to `llama-3.1-8b-instant` in the event of model deprecation or temporary unavailability.

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

To guarantee reliable rendering and prevent output formatting errors, inference is locked to JSON mode using `response_format: { type: "json_object" }`. The model is constrained to return data adhering to this TypeScript interface:

```typescript
interface AnalysisResult {
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  summary: string;
  flags: Array<{
    issue: string;        // Concise title of the identified red flag
    detail: string;       // Exact or near-exact quote extracted from the job post
    explanation: string;  // Plain-language explanation of why this detail represents a risk
  }>;
  legitimate_signals: string[]; // Positive trust indicators identified (for LOW/MEDIUM risk posts)
}
```

---

## 🛠️ Tech Stack

| Layer | Technologies & Dependencies |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) (`react` `19.0.1`, `react-dom` `19.0.1`) |
| **Language & Tooling** | [TypeScript](https://www.typescriptlang.org/) (`~5.8.2`), [Vite](https://vitejs.dev/) (`6.2.3`) |
| **Styling & Design** | [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/vite` `4.1.14`), [Lucide React](https://lucide.dev/) (`0.546.0`) |
| **Animations** | [Motion](https://motion.dev/) (`motion` `12.23.24`) |
| **Local Server** | [Express](https://expressjs.com/) (`4.21.2`), [tsx](https://github.com/privatenumber/tsx) (`4.21.0`), [dotenv](https://github.com/motdotla/dotenv) (`17.2.3`) |
| **Inference API** | [Groq Cloud](https://console.groq.com/) (`llama-3.3-70b-versatile`) |
| **Deployment** | [Vercel](https://vercel.com/) (Edge / Serverless Functions) |

---

## 🚀 Setup & Local Development

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Groq API Key:** Obtainable for free at [Groq Console](https://console.groq.com/keys)

### Step-by-Step Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/jhoot-detector.git
   cd jhoot-detector
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the project root based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Add your Groq Cloud API key to `.env`:
   ```env
   GROQ_API_KEY=gsk_your_actual_groq_api_key_here
   ```

4. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## ☁️ Deployment on Vercel

Jhoot Detector is configured for one-click deployment on Vercel using serverless API routes:

1. **Push to GitHub:** Ensure your repository is pushed to GitHub.
2. **Import Project in Vercel:** Go to [Vercel Dashboard](https://vercel.com/new) and import the repository.
3. **Configure Environment Variables:**
   Under **Project Settings > Environment Variables**, add:
   - `GROQ_API_KEY`: `gsk_...` (Your Groq Cloud API key)
4. **Build & Output Settings:**
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. **Deploy:** Click **Deploy**. The serverless function under `/api/analyze` will deploy automatically alongside the static frontend bundle.

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

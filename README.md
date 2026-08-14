# Jhoot Detector 🕵️ — Pakistani Job Scam Post Analyzer

> An AI-powered scam analysis tool that evaluates job postings from Pakistani social media groups and job boards to detect recruitment fraud, upfront fee scams, and identity theft traps.

Built under a 2-hour sprint constraint for the **Chai Aur Code x GDG Pakistan @79 Hackathon**.

---

## 📌 The Problem

Online recruitment fraud has surged across Pakistan, exploiting students, fresh graduates, and unemployed youth across WhatsApp forwards, Facebook groups, OLX, and unmoderated job portals. Common traps include:

1. **Upfront Payment Extortion:** Scammers promise high salaries (e.g., PKR 80,000/month for simple data entry or SMS processing) but require job seekers to transfer PKR 1,500–5,000 as a "security deposit," "portal activation fee," or "training charge" via Easypaisa or JazzCash.
2. **CNIC & Identity Harvesting:** Unverified entities collect copies of Computerized National Identity Cards (CNIC), personal photos, and sensitive data prior to any formal interview or offer letter, putting candidates at risk of identity theft and illegal SIM registrations.
3. **Fake Corporate Impersonation:** Fraudulent recruiters disguise themselves as multinational corporations or established local tech firms while communicating solely through free `@gmail.com` or `@outlook.com` addresses without verifiable company domains.

---

## ⚙️ How It Works

1. **Paste Job Posting:** The user pastes any raw job post text copied from WhatsApp, Facebook, LinkedIn, Rozee.pk, or SMS into the input area (or selects one of the pre-loaded benchmark sample posts).
2. **Heuristic LLM Analysis:** The backend calls Groq's high-speed inference API running **Llama 3.3 70B** with a structured prompt tailored specifically to Pakistani recruitment scam markers.
3. **Actionable Scam Verdict:** The system returns a structured evaluation:
   - **Risk Level Badge:** `HIGH RISK` (red), `MEDIUM RISK` (amber), or `LOW RISK` (emerald).
   - **Summary:** A one-sentence direct verdict on the posting's credibility.
   - **Identified Red Flags:** A breakdown of flagged issues, quoting the exact suspicious phrases with contextual explanations of why they represent a risk.
   - **Legitimate Signals:** In low/medium-risk postings, an outline of elements that build confidence (e.g., verifiable domain email, realistic pay band, standard interview stages).

---

## 🚩 Red Flag Detection Categories

The system evaluates job postings against these core fraud indicators:

- **Upfront Fee Demands:** Requests for registration charges, processing fees, or refundable deposits prior to onboarding.
- **Unverifiable / Generic Recruiter Identity:** Absence of official domain emails, reliance on generic free mail providers (`@gmail.com`, `@yahoo.com`), and missing official web domains.
- **Unrealistic Compensation:** Outsized salary figures for low-skill or zero-experience roles (e.g., 100k PKR/month for basic smartphone typing).
- **Artificial Urgency & Pressure Tactics:** Phrases like *"Only 3 seats remaining today,"* *"Immediate joining without interview,"* or *"First 10 applicants only."*
- **Premature CNIC & Sensitive Data Collection:** Demands for CNIC front/back copies or banking credentials early in the communication channel.
- **Vague Role Description:** Advertisements lacking clear responsibilities, skills, or prerequisites, relying purely on broad earning promises.
- **Formatting Inconsistencies:** Heavy spam-like emoji density, excessive exclamation marks, and informal styling atypical of professional corporate postings.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Motion.
- **Backend / API Route:** Node.js, Express.
- **LLM Inference:** [Groq Cloud](https://groq.com/) API running `llama-3.3-70b-versatile` (with automatic fallback to `llama-3.1-8b-instant`).
- **Deployment Target:** Vercel (or Cloud Run / Node.js container environments).

---

## 🚀 Local Setup & Installation

### Prerequisites
- Node.js (v18 or higher recommended)
- A [Groq Cloud API Key](https://console.groq.com/keys)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/jhoot-detector.git
cd jhoot-detector
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the root directory (or copy from `.env.example`):
```bash
cp .env.example .env
```

Add your Groq API key:
```env
GROQ_API_KEY="gsk_your_groq_api_key_here"
```

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deployment on Vercel

1. Push your repository to GitHub.
2. Import the project into the [Vercel Dashboard](https://vercel.com/new).
3. Under **Environment Variables**, configure:
   - `GROQ_API_KEY`: Your secret Groq API key.
4. Keep the default build settings (`npm run build`, output directory `dist`).
5. Click **Deploy**.

---

## 📸 Screenshots

<!-- Placeholder: Add actual application screenshots here -->
| Job Post Input & Quick Fill | Analysis Report & Red Flags |
| :---: | :---: |
| *[Screenshot Placeholder: Input View]* | *[Screenshot Placeholder: Results View]* |

---

## ⚠️ Limitations & Disclaimer

- **Heuristic AI Tool, Not an Official Registry:** Jhoot Detector evaluates text using an AI language model prompted against known scam heuristics; it does not connect to SECP, PSEB, or government corporate registries to verify business registration numbers.
- **False Positives / Negatives:** Legitimate small businesses without custom email domains may be flagged with caution, and sophisticated scammers who omit upfront fee mentions until private chats may receive lower initial risk scores.
- **Exercise Independent Judgment:** Always independently research companies, never pay money to secure a job, and never share CNIC scans or OTPs with unverified recruiters.

---

## 🏆 Hackathon Context

Built within a **2-hour rapid development sprint** for the **Chai Aur Code x GDG Pakistan @79 Hackathon**, focusing on practical AI utility tools that address everyday challenges faced by Pakistani youth.

---

## 📄 License
This project is open-source and available for educational and commercial use under the MIT License.
---
**Made with ❤️ by [Abdul Hayy Khan](https://www.linkedin.com/in/abdulhayykhan/)**

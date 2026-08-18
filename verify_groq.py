"""
Groq Model & Endpoint Verification Script for Jhoot Detector
Tests connectivity, active models, JSON mode support, and analysis across all 3 sample posts.
"""

import os
import sys
import json
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get("GROQ_API_KEY")
if not api_key:
    print("\n[!] GROQ_API_KEY is not set in environment or .env file.")
    print("    To run live verification: python verify_groq.py <YOUR_GROQ_API_KEY>")
    if len(sys.argv) > 1:
        api_key = sys.argv[1].strip()
    else:
        sys.exit(1)

print(f"\n[*] Using GROQ_API_KEY: {api_key[:6]}...{api_key[-4:] if len(api_key) > 10 else ''}")

# 1. Query /openai/v1/models to confirm available models
print("\n--- [STEP 1] Checking Groq Available Models ---")
models_url = "https://api.groq.com/openai/v1/models"
try:
    res = requests.get(models_url, headers={"Authorization": f"Bearer {api_key}"}, timeout=15)
    if res.ok:
        data = res.json()
        model_ids = [m["id"] for m in data.get("data", [])]
        print(f"[+] Successfully fetched {len(model_ids)} available models from Groq.")
        print(f"    Available models: {model_ids}")
        
        target_model = "openai/gpt-oss-120b"
        if target_model in model_ids:
            print(f"[+] CONFIRMED: '{target_model}' is accessible on this API key!")
        else:
            print(f"[!] WARNING: '{target_model}' not found in active model list. Available models: {model_ids}")
    else:
        print(f"[-] Failed to fetch models: HTTP {res.status_code} - {res.text}")
except Exception as e:
    print(f"[-] Error querying models endpoint: {e}")

# 2. Test analysis endpoint with all 3 sample posts
print("\n--- [STEP 2] Testing Analysis across High, Medium, and Low Risk Samples ---")
from app import SYSTEM_INSTRUCTION, call_groq_chat_completions, parse_model_json

SAMPLES = [
    {
        "name": "High Risk Sample (Upfront Easypaisa Fee)",
        "expected": "HIGH",
        "text": """🔥 URGENT HIRING: WORK FROM HOME OPPORTUNITY! 🔥
Earn PKR 80,000 to 120,000 per month! 💰
No qualifications or prior experience needed. Just 2-3 hours daily on your smartphone or laptop.
Post: Online Data Entry & SMS Processing Executive
Requirements: Age 18+, Male / Female both can apply.
Daily payments via Easypaisa or JazzCash.
⚠️ ATTENTION: Only 3 seats left today! Immediate joining without any interview.
To activate your portal account, pay one-time refundable registration fee of PKR 2,500 via Easypaisa to 0345-XXXXXXX."""
    },
    {
        "name": "Medium Risk Sample (Unverified Outlook Email & Pre-interview CNIC)",
        "expected": "MEDIUM",
        "text": """Hiring Alert: Customer Service Executive (Remote/Karachi)
Company: Prime Solutions Global PK
Salary: PKR 85,000 - 95,000 / month (Above industry standard)
Responsibilities: Handling inbound customer calls and email queries.
Requirements: Good English communication skills, Intermediate / Bachelors.
How to Apply: Please send your CV along with clear scanned copies of your CNIC (front & back) and recent photograph immediately to hr.primesolutions@outlook.com or WhatsApp at 0321-XXXXXXX."""
    },
    {
        "name": "Low Risk Sample (Legitimate TechCorp SQA Role)",
        "expected": "LOW",
        "text": """Position: Associate Software Quality Assurance Engineer
Company: TechCorp Pakistan (Pvt.) Ltd.
Location: Gulberg III, Lahore / Hybrid
Job Description: TechCorp Pakistan is looking for an Associate SQA Engineer to join our core fintech development team.
Responsibilities: Create comprehensive test plans, manual API testing.
Requirements: BS in Computer Science, 0-1 year experience, solid understanding of SDLC and Jira.
Compensation: PKR 90,000 - 120,000 based on interview evaluation + OPD/IPD medical insurance + Provident fund.
How to Apply: Submit resume at https://careers.techcorp.pk or email recruitment@techcorp.pk. We never ask for any fees at any stage."""
    }
]

model_to_test = "openai/gpt-oss-120b"
for sample in SAMPLES:
    print(f"\n[Testing] {sample['name']} (Expected: {sample['expected']})")
    try:
        user_prompt = f'Please analyze this Pakistani job posting for scams and red flags:\n\n"""\n{sample["text"]}\n"""'
        res = call_groq_chat_completions(api_key, model_to_test, user_prompt)
        if res.ok:
            content = res.json()["choices"][0]["message"]["content"]
            parsed = parse_model_json(content)
            verdict = parsed.get("risk_level")
            print(f"  -> Result Risk: {verdict}")
            print(f"  -> Summary: {parsed.get('summary')}")
            print(f"  -> Flags Count: {len(parsed.get('flags', []))}")
            if parsed.get("flags"):
                for f in parsed["flags"]:
                    print(f"     * [{f.get('issue')}]: {f.get('explanation')}")
            print(f"  -> Match Expected ({sample['expected']})? {'✅ YES' if verdict == sample['expected'] else '⚠️ DIFF: ' + str(verdict)}")
        else:
            print(f"  [-] Groq API call failed: HTTP {res.status_code} - {res.text}")
    except Exception as e:
        print(f"  [-] Exception during test: {e}")

print("\n--- Verification Complete ---")

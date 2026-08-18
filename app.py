"""
Jhoot Detector — Flask Backend
Pakistani Job Scam Analyzer powered by Groq AI (Llama 3.3 70B)

Run locally:   flask run
Production:    gunicorn app:app

DEPLOYMENT NOTE:
  This Flask app will NOT deploy on Vercel the same way the previous
  React/Vercel-serverless version did. Vercel's Python runtime has
  constraints (10s serverless function timeout on free tier, cold starts,
  no persistent process). For a persistent Flask app, recommended
  platforms are:
    - Render.com  (free tier, auto-deploy from GitHub, always-on)
    - Railway.app (usage-based billing, simple deploy)
  Both support gunicorn and environment variables natively.
"""

import os
import re
import json
import requests as http_requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

app = Flask(__name__, static_folder=STATIC_DIR, static_url_path="")
CORS(app)  # Needed if frontend/backend served separately in dev; same-origin in prod

# ---------------------------------------------------------------------------
# System prompt — copied VERBATIM from api/analyze.ts
# Preserves the calibrated severity-weighting rules including the fix where
# isolated medium flags should NOT auto-escalate to HIGH.
# ---------------------------------------------------------------------------
SYSTEM_INSTRUCTION = """You are a job-scam detection assistant specialized in the Pakistani job market (Rozee.pk, Facebook groups, WhatsApp job forwards, LinkedIn Pakistan, Mustakbil, OLX Pakistan jobs). 

Analyze the given job posting text and evaluate against these specific red flag categories:

FLAG SEVERITY WEIGHTING:
[CRITICAL SEVERITY FLAGS] (Any 1 of these instantly results in HIGH RISK):
- Upfront payment/fee requests of any kind (registration fee, training fee, "refundable security deposit", portal activation, certificate fee, Easypaisa/JazzCash/bank transfer)
- Extreme salary-to-effort absurdity combined with no verifiable entity (e.g. PKR 100k/month for 2 hours daily typing with zero qualifications)

[MEDIUM SEVERITY FLAGS]:
- Premature sensitive identity/document requests (CNIC front/back copy, bank account, OTP, personal photo) before any formal interview, skill assessment, or written offer
- Unverifiable entity using generic public email domains (@gmail.com, @yahoo.com, @outlook.com) instead of a corporate domain
- High urgency / pressure tactics ("only 3 seats left today", "immediate joining with no interview", "first 10 applicants only")
- Vague job description or deliverables lacking concrete responsibilities
- Salary noticeably above market rate for the role, but not outright absurd

[LOW/STYLISTIC FLAGS]:
- Informal styling, excessive emojis, or non-standard formatting in an otherwise standard posting

For each red flag found:
- Specify the issue (short concise title)
- Extract the exact or near-exact phrase/detail that triggered it
- Provide a clear one-sentence explanation of why it's suspicious in the Pakistani context

RISK CLASSIFICATION RULES:
- "HIGH": 
  * Triggered if at least ONE [CRITICAL SEVERITY FLAG] is present (e.g. upfront fee/deposit via Easypaisa/JazzCash).
  * OR triggered if TWO OR MORE (2+) [MEDIUM SEVERITY FLAGS] are present in the posting.
- "MEDIUM": 
  * Triggered strictly when exactly ONE (1) [MEDIUM SEVERITY FLAG] is present in isolation (e.g. CNIC/photo requested pre-interview WITHOUT any upfront fee, OR a generic public email on an otherwise structured job ad with realistic pay).
  * IMPORTANT: Never escalate a single isolated medium-severity signal to HIGH RISK if there are no upfront payments or other accompanying red flags.
- "LOW": 
  * Triggered when there are ZERO Critical or Medium severity flags (or only minor stylistic/formatting observations) with a verifiable domain, clear job description, and standard hiring process.

If risk is LOW or MEDIUM, explicitly list the legitimate signals that build confidence.

Respond ONLY in this JSON structure:
{
  "risk_level": "LOW" | "MEDIUM" | "HIGH",
  "summary": "one sentence verdict",
  "flags": [
    {"issue": "short label", "detail": "the specific phrase or detail", "explanation": "why it's suspicious"}
  ],
  "legitimate_signals": ["list of things that looked okay, only if risk is LOW or MEDIUM"]
}"""

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
PRIMARY_MODEL = "llama-3.3-70b-versatile"
FALLBACK_MODEL = "llama-3.1-8b-instant"


def call_groq_chat_completions(api_key: str, model: str, user_prompt: str):
    """Call Groq's OpenAI-compatible chat completions endpoint."""
    return http_requests.post(
        GROQ_API_URL,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": SYSTEM_INSTRUCTION},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.3,
        },
        timeout=60,
    )


# ---------------------------------------------------------------------------
# Static file serving — Flask serves the frontend
# ---------------------------------------------------------------------------
@app.route("/")
def serve_index():
    return send_from_directory(app.static_folder, "index.html")


# ---------------------------------------------------------------------------
# POST /api/analyze — Job posting analysis endpoint
# ---------------------------------------------------------------------------
@app.route("/api/analyze", methods=["POST"])
def analyze():
    try:
        data = request.get_json(silent=True) or {}
        text = data.get("text", "")

        if not text or not isinstance(text, str) or not text.strip():
            return jsonify({"error": "Job posting text is required."}), 400

        if len(text.strip()) < 15:
            return (
                jsonify(
                    {
                        "error": "Please provide a more detailed job posting text to analyze."
                    }
                ),
                400,
            )

        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            return (
                jsonify(
                    {
                        "error": "GROQ_API_KEY is not configured. Please add it to your .env file or environment variables."
                    }
                ),
                400,
            )

        user_prompt = (
            f'Please analyze this Pakistani job posting for scams and red flags:\n\n'
            f'"""\n{text.strip()}\n"""'
        )

        # Primary model attempt
        try:
            groq_res = call_groq_chat_completions(api_key, PRIMARY_MODEL, user_prompt)
        except http_requests.exceptions.Timeout:
            return (
                jsonify(
                    {"error": "Analysis service timed out. Please try again."}
                ),
                504,
            )
        except http_requests.exceptions.ConnectionError:
            return (
                jsonify(
                    {
                        "error": "Could not connect to analysis service. Please check your connection."
                    }
                ),
                503,
            )

        # Fallback if primary model is unavailable (404 or 400 with model_not_found)
        if groq_res.status_code in (404, 400):
            err_text = groq_res.text
            if "model_not_found" in err_text or "does not exist" in err_text:
                try:
                    groq_res = call_groq_chat_completions(
                        api_key, FALLBACK_MODEL, user_prompt
                    )
                except (
                    http_requests.exceptions.Timeout,
                    http_requests.exceptions.ConnectionError,
                ):
                    return (
                        jsonify(
                            {
                                "error": "Analysis service unavailable. Please try again later."
                            }
                        ),
                        503,
                    )

        # Handle rate limiting
        if groq_res.status_code == 429:
            return (
                jsonify(
                    {
                        "error": "Analysis service busy due to rate limits, please retry in a moment."
                    }
                ),
                429,
            )

        # Handle server errors
        if groq_res.status_code >= 500:
            return (
                jsonify(
                    {"error": "Analysis service busy, please retry in a moment."}
                ),
                503,
            )

        # Handle other non-OK responses
        if not groq_res.ok:
            try:
                error_json = groq_res.json()
                err_msg = (
                    error_json.get("error", {}).get("message")
                    or f"Groq API request failed with status {groq_res.status_code}"
                )
            except (ValueError, KeyError):
                err_msg = f"Groq API request failed with status {groq_res.status_code}"

            if groq_res.status_code == 429:
                err_msg = "Analysis service busy, please retry in a moment."

            app.logger.error("Groq API error: %s", groq_res.text)
            return jsonify({"error": err_msg}), groq_res.status_code

        # Parse successful response
        response_data = groq_res.json()
        message_content = (
            response_data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "{}")
        )

        # Parse JSON from model output (with regex fallback for malformed responses)
        try:
            parsed_data = json.loads(message_content)
        except json.JSONDecodeError:
            match = re.search(r"\{[\s\S]*\}", message_content)
            if match:
                parsed_data = json.loads(match.group(0))
            else:
                raise ValueError(
                    "Failed to parse analysis response from Groq engine."
                )

        # Sanitize risk level & arrays (identical to original TS logic)
        normalized_risk = str(parsed_data.get("risk_level", "HIGH")).upper()
        parsed_data["risk_level"] = (
            normalized_risk if normalized_risk in ("LOW", "MEDIUM", "HIGH") else "MEDIUM"
        )
        parsed_data["flags"] = (
            parsed_data["flags"]
            if isinstance(parsed_data.get("flags"), list)
            else []
        )
        parsed_data["legitimate_signals"] = (
            parsed_data["legitimate_signals"]
            if isinstance(parsed_data.get("legitimate_signals"), list)
            else []
        )

        return jsonify(parsed_data), 200

    except Exception as e:
        app.logger.error(
            "Error analyzing job posting with Groq: %s", str(e), exc_info=True
        )
        return (
            jsonify(
                {
                    "error": str(e)
                    or "An unexpected error occurred while analyzing the job posting."
                }
            ),
            500,
        )


if __name__ == "__main__":
    app.run(debug=True, port=3000)

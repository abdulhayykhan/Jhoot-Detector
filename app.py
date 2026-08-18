"""
Jhoot Detector — Flask Backend
Pakistani Job Scam Analyzer powered by Groq AI (GPT-OSS 120B)

Run locally:   flask run (or python app.py)
Production:    gunicorn app:app / Vercel Serverless Function
"""

import os
import re
import json
import logging
import requests as http_requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("jhoot_detector")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

app = Flask(__name__, static_folder=STATIC_DIR, static_url_path="")
CORS(app)  # Needed if frontend/backend served separately in dev; same-origin in prod

# ---------------------------------------------------------------------------
# System prompt — Calibrated severity-weighting rules for Pakistani job scams
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

RISK CLASSIFICATION RULES (STRICT HIERARCHY):
- "HIGH": 
  * MANDATORY REQUIREMENT: HIGH RISK is STRICTLY reserved for postings with an explicit UPFRONT PAYMENT / FEE DEMAND (e.g. registration fee, training fee, "refundable deposit", portal activation, Easypaisa/JazzCash/bank transfer) OR extreme salary absurdity (e.g. PKR 100k/month for 2h smartphone typing with zero experience).
  * ABSOLUTE RULE: If a posting does NOT ask for money/fees and does NOT have absurd salary promises, it MUST NEVER be classified as HIGH RISK.

- "MEDIUM": 
  * Assigned when caution signals are present (e.g. premature CNIC/photo request, generic free email like @outlook.com/@gmail.com, vague description, or urgency) BUT THERE IS NO UPFRONT PAYMENT/FEE REQUEST.
  * Even if multiple caution flags exist together (e.g. both @outlook.com AND a CNIC copy request), if there is NO payment/fee demand, the risk_level MUST be "MEDIUM", NOT "HIGH".

- "LOW": 
  * Assigned when there are ZERO fee demands, no premature CNIC requests, a legitimate corporate entity/careers portal, clear job responsibilities, and standard hiring procedures.

If risk is LOW or MEDIUM, explicitly list the legitimate signals that build confidence.

OUTPUT FORMAT INSTRUCTION:
Respond ONLY with a valid JSON object. Do not include markdown formatting, code blocks (e.g. ```json), or any conversational introductory or concluding text.

JSON Structure:
{
  "risk_level": "LOW" | "MEDIUM" | "HIGH",
  "summary": "one sentence verdict",
  "flags": [
    {"issue": "short label", "detail": "the specific phrase or detail", "explanation": "why it's suspicious"}
  ],
  "legitimate_signals": ["list of things that looked okay, only if risk is LOW or MEDIUM"]
}"""

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
PRIMARY_MODEL = "openai/gpt-oss-120b"
FALLBACK_MODEL = "openai/gpt-oss-20b"


def call_groq_chat_completions(api_key: str, model: str, user_prompt: str):
    """Call Groq's OpenAI-compatible chat completions endpoint with structured logging."""
    logger.info(f"[GROQ REQUEST] Calling model '{model}' at {GROQ_API_URL}")
    response = http_requests.post(
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
    logger.info(f"[GROQ RESPONSE] Model '{model}' responded with HTTP {response.status_code}")
    return response


def parse_model_json(message_content: str) -> dict:
    """Robust JSON extraction handling reasoning models, think tags, and markdown codeblocks."""
    if not message_content or not isinstance(message_content, str):
        raise ValueError("Empty message content received from model.")

    # 1. Strip reasoning / thinking tags if emitted by reasoning models
    cleaned = re.sub(r"<think>[\s\S]*?</think>", "", message_content).strip()

    # 2. Strip markdown code fences (e.g. ```json ... ```)
    code_block_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
    if code_block_match:
        cleaned = code_block_match.group(1).strip()

    # 3. Attempt direct JSON parsing
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # 4. Fallback: extract outermost JSON object with regex
    json_match = re.search(r"\{[\s\S]*\}", cleaned)
    if json_match:
        return json.loads(json_match.group(0))

    raise ValueError(f"Could not parse valid JSON from model response: {message_content[:200]}")


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
            logger.warning("[AUTH ERROR] GROQ_API_KEY is not configured in environment.")
            return (
                jsonify(
                    {
                        "error": "GROQ_API_KEY is not configured. Please add it to your .env file or Vercel Environment Variables."
                    }
                ),
                400,
            )

        user_prompt = (
            f'Please analyze this Pakistani job posting for scams and red flags:\n\n'
            f'"""\n{text.strip()}\n"""'
        )

        active_model = PRIMARY_MODEL

        # Primary model attempt
        try:
            groq_res = call_groq_chat_completions(api_key, PRIMARY_MODEL, user_prompt)
        except http_requests.exceptions.Timeout:
            logger.error(f"[TIMEOUT] Request to model '{PRIMARY_MODEL}' timed out after 60s.")
            return (
                jsonify(
                    {"error": "Analysis service timed out. Please try again."}
                ),
                504,
            )
        except http_requests.exceptions.ConnectionError as conn_err:
            logger.error(f"[CONNECTION ERROR] Failed to connect to Groq: {conn_err}")
            return (
                jsonify(
                    {
                        "error": "Could not connect to analysis service. Please check your connection."
                    }
                ),
                503,
            )

        # Fallback if primary model is unavailable (404 model not found, or 400 error referencing model)
        if groq_res.status_code in (404, 400):
            err_text = groq_res.text
            if "model_not_found" in err_text or "does not exist" in err_text or "not_found" in err_text:
                logger.warning(
                    f"[MODEL FALLBACK] Primary model '{PRIMARY_MODEL}' unavailable ({err_text[:120]}). "
                    f"Falling back to '{FALLBACK_MODEL}'..."
                )
                active_model = FALLBACK_MODEL
                try:
                    groq_res = call_groq_chat_completions(
                        api_key, FALLBACK_MODEL, user_prompt
                    )
                except (
                    http_requests.exceptions.Timeout,
                    http_requests.exceptions.ConnectionError,
                ) as fallback_err:
                    logger.error(f"[FALLBACK FAILED] Error calling fallback model '{FALLBACK_MODEL}': {fallback_err}")
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
            logger.warning(f"[RATE LIMIT] Groq rate limit reached on model '{active_model}': {groq_res.text[:150]}")
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
            logger.error(f"[GROQ 5XX] Groq server error on model '{active_model}' (HTTP {groq_res.status_code}): {groq_res.text[:200]}")
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

            logger.error(f"[GROQ API ERROR] Status {groq_res.status_code} on model '{active_model}': {err_msg}")
            return jsonify({"error": err_msg}), groq_res.status_code

        # Parse successful response
        response_data = groq_res.json()
        message_content = (
            response_data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "{}")
        )

        try:
            parsed_data = parse_model_json(message_content)
        except Exception as parse_err:
            logger.error(f"[PARSE ERROR] Failed to parse model JSON: {parse_err}. Raw content: {message_content[:300]}")
            return jsonify({"error": "Failed to parse analysis response from Groq engine."}), 500

        # Sanitize risk level & arrays
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

        logger.info(
            f"[ANALYSIS SUCCESS] Model: {active_model} | Risk: {parsed_data['risk_level']} | "
            f"Flags: {len(parsed_data['flags'])} | Legit Signals: {len(parsed_data['legitimate_signals'])}"
        )

        return jsonify(parsed_data), 200

    except Exception as e:
        logger.error(
            "[UNHANDLED EXCEPTION] Error analyzing job posting: %s", str(e), exc_info=True
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

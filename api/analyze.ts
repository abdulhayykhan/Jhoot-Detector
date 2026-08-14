const SYSTEM_INSTRUCTION = `You are a job-scam detection assistant specialized in the Pakistani job market (Rozee.pk, Facebook groups, WhatsApp job forwards, LinkedIn Pakistan, Mustakbil, OLX Pakistan jobs). 

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
}`;

async function callGroqChatCompletions(
  apiKey: string,
  model: string,
  userPrompt: string
) {
  return await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });
}

export default async function handler(req: any, res: any) {
  // Support both GET for health-check and POST for analysis
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  try {
    const { text } = req.body || {};

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "Job posting text is required." });
    }

    if (text.trim().length < 15) {
      return res.status(400).json({
        error: "Please provide a more detailed job posting text to analyze.",
      });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error:
          "GROQ_API_KEY is not configured in Vercel environment variables. Please add GROQ_API_KEY in your Vercel Project Settings > Environment Variables.",
      });
    }

    const userPrompt = `Please analyze this Pakistani job posting for scams and red flags:\n\n"""\n${text.trim()}\n"""`;

    const primaryModel = "llama-3.3-70b-versatile";
    const fallbackModel = "llama-3.1-8b-instant";

    let groqRes = await callGroqChatCompletions(apiKey, primaryModel, userPrompt);

    // Fallback if primary model is unavailable
    if (groqRes.status === 404 || groqRes.status === 400) {
      const errText = await groqRes.clone().text();
      if (errText.includes("model_not_found") || errText.includes("does not exist")) {
        groqRes = await callGroqChatCompletions(apiKey, fallbackModel, userPrompt);
      }
    }

    if (groqRes.status === 429) {
      return res.status(429).json({
        error: "Analysis service busy due to rate limits, please retry in a moment.",
      });
    }

    if (groqRes.status >= 500) {
      return res.status(503).json({
        error: "Analysis service busy, please retry in a moment.",
      });
    }

    if (!groqRes.ok) {
      const errorJson = await groqRes.json().catch(() => ({}));
      const errMsg =
        errorJson?.error?.message ||
        `Groq API request failed with status ${groqRes.status}`;
      console.error("Groq API error response:", errorJson);
      return res.status(groqRes.status).json({
        error:
          groqRes.status === 429
            ? "Analysis service busy, please retry in a moment."
            : errMsg,
      });
    }

    const data = await groqRes.json();
    const messageContent = data?.choices?.[0]?.message?.content || "{}";

    let parsedData: any;
    try {
      parsedData = JSON.parse(messageContent);
    } catch {
      const match = messageContent.match(/\{[\s\S]*\}/);
      if (match) {
        parsedData = JSON.parse(match[0]);
      } else {
        throw new Error("Failed to parse analysis response from Groq engine.");
      }
    }

    // Sanitize risk level & arrays
    const normalizedRisk = String(parsedData.risk_level || "HIGH").toUpperCase();
    parsedData.risk_level = ["LOW", "MEDIUM", "HIGH"].includes(normalizedRisk)
      ? normalizedRisk
      : "MEDIUM";
    parsedData.flags = Array.isArray(parsedData.flags) ? parsedData.flags : [];
    parsedData.legitimate_signals = Array.isArray(parsedData.legitimate_signals)
      ? parsedData.legitimate_signals
      : [];

    return res.status(200).json(parsedData);
  } catch (error: any) {
    console.error("Error analyzing job posting with Groq on Vercel Serverless:", error);
    return res.status(500).json({
      error:
        error.message ||
        "An unexpected error occurred while analyzing the job posting.",
    });
  }
}

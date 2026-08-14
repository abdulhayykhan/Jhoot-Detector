const SYSTEM_INSTRUCTION = `You are a job-scam detection assistant specialized in the Pakistani job market (Rozee.pk, Facebook groups, WhatsApp job forwards, LinkedIn Pakistan, Mustakbil, OLX Pakistan jobs). 

Analyze the given job posting text and evaluate against these specific red flag categories:
1. Upfront payment/fee requests (registration fee, training fee, "security deposit", processing charges, Easypaisa/JazzCash transfers)
2. Vague or unverifiable company name/details (no website, generic @gmail.com/@yahoo.com email instead of corporate company domain)
3. Unrealistic salary for the stated role/experience level (e.g., PKR 80,000-200,000/month for simple typing/data entry with zero experience)
4. Urgency/pressure language ("apply now, only 3 seats left today", "immediate joining, no interview required", "first 10 candidates only")
5. Requests for sensitive personal info early (CNIC front/back copy, bank account/OTP, personal photos) before any interview or contract
6. Poor grammar, unprofessional formatting, excessive exclamation marks, spam emoji patterns inconsistent with professional postings
7. No clear job description or deliverables — just vague promises ("work from home 2 hours daily, earn guaranteed 50k")

For each red flag found:
- Specify the issue (short concise title)
- Extract the exact or near-exact phrase/detail that triggered it
- Provide a clear one-sentence explanation of why it's suspicious in the Pakistani context

Assign an overall risk level:
- "HIGH": Contains direct scam markers (upfront payment, fee before onboarding, Easypaisa deposit, immediate CNIC/bank demand, absurd salary for no skill)
- "MEDIUM": Has questionable markers (generic email, unverified brand, vague scope, missing domain) but no overt money extortion yet
- "LOW": Professional posting with realistic pay, verifiable corporate identity, clear requirements, legitimate application process

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

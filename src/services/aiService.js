/**
 * AI Service - Uses Gemini API with graceful fallback if API fails.
 * Pro plan required for AI features; Free plan users get fallback responses.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Groq } from "groq-sdk";

let GeminiClient = null;
let GroqClient = null;

// Initialize Gemini
try {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (key && key !== "undefined") {
    GeminiClient = new GoogleGenerativeAI(key);
    console.log("[AI] Gemini client initialized");
  } else {
    console.warn("[AI] GEMINI_API_KEY missing - Gemini disabled");
  }
} catch (err) {
  console.warn("[AI] Gemini init failed:", err.message);
}

// Initialize Groq
try {
  const key = process.env.GROQ_API_KEY?.trim();
  if (key && key !== "undefined") {
    GroqClient = new Groq({ apiKey: key });
    console.log("[AI] Groq client initialized");
  } else {
    console.warn("[AI] GROQ_API_KEY missing - Groq disabled");
  }
} catch (err) {
  console.warn("[AI] Groq init failed:", err.message);
}

const AI_AVAILABLE = !!GeminiClient || !!GroqClient;
console.log("[AI] Status:", { Gemini: !!GeminiClient, Groq: !!GroqClient, AI_AVAILABLE });

async function generateAIResponse(prompt) {
  if (!AI_AVAILABLE) return null;
  const content = typeof prompt === "string" ? prompt : JSON.stringify(prompt);

  // Try Groq first because it is faster
  if (GroqClient) {
    try {
      const completion = await GroqClient.chat.completions.create({
        messages: [{ role: "user", content }],
        model: "llama-3.3-70b-versatile",
      });
      const text = completion.choices[0]?.message?.content;
      if (text) return text;
    } catch (err) {
      console.warn("[AI] Groq generation failed:", err.message);
    }
  }

  // Fallback to Gemini
  if (GeminiClient) {
    const GEMINI_MODELS = ["gemini-1.5-flash", "gemini-1.5-pro"];
    for (const modelName of GEMINI_MODELS) {
      try {
        const model = GeminiClient.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(content);
        const response = await result.response;
        const text = response.text();
        if (text) return text;
      } catch (err) {
        console.warn(`[AI] Gemini ${modelName} failed:`, err.message);
        if (err.message?.includes("401") || err.message?.includes("API_KEY_INVALID")) break;
      }
    }
  }

  return null;
}

/** AI Feature 1 - Smart Symptom Checker */
export async function symptomChecker({ symptoms, age, gender, history }) {
  const prompt = `As a medical assistant, analyze these symptoms and provide a structured response in JSON format:
Symptoms: ${Array.isArray(symptoms) ? symptoms.join(", ") : String(symptoms || "")}
Patient age: ${age ?? "unknown"}
Gender: ${gender ?? "unknown"}
Medical history: ${String(history || "Not provided")}

Respond ONLY with valid JSON in this exact structure (no markdown):
{"possibleConditions":["condition1","condition2"],"riskLevel":"low|medium|high","suggestedTests":["test1","test2"]}`;

  const raw = await generateAIResponse(prompt);
  if (!raw) {
    return {
      possibleConditions: ["Unable to analyze - AI unavailable. Please consult manually."],
      riskLevel: "low",
      suggestedTests: ["General checkup recommended"],
      rawResponse: null,
    };
  }
  try {
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      possibleConditions: parsed.possibleConditions || [],
      riskLevel: parsed.riskLevel || "low",
      suggestedTests: parsed.suggestedTests || [],
      rawResponse: raw,
    };
  } catch {
    return {
      possibleConditions: [],
      riskLevel: "low",
      suggestedTests: [],
      rawResponse: raw,
    };
  }
}

/** AI Feature 2 - Prescription Explanation (patient-friendly) */
export async function explainPrescription({ medicines, diagnosis, instructions }) {
  const prompt = `Explain this prescription in simple, patient-friendly language (2-3 sentences per medicine). Include lifestyle recommendations and preventive advice if relevant.

Diagnosis: ${diagnosis || "Not specified"}
Medicines: ${JSON.stringify(medicines || [])}
Instructions: ${instructions || "None"}

Provide a clear, concise explanation in plain English.`;
  const text = await generateAIResponse(prompt);
  return text;
}

/** AI Feature 2b - Urdu explanation (optional) */
export async function explainPrescriptionUrdu({ medicines, diagnosis }) {
  const prompt = `ایسے نسخے کو آسان اردو میں تشریح کریں۔ ہر دوا کے لیے 2-3 جملے لکھیں۔

تشخیص: ${diagnosis || "مخصوص نہیں"}
ادویات: ${JSON.stringify(medicines || [])}

صرف اردو میں جواب دیں۔`;
  const text = await generateAIResponse(prompt);
  return text;
}

/** AI Feature 3 - Risk Flagging (repeated patterns, chronic symptoms) */
export async function flagRisks(patientDiagnoses) {
  if (!patientDiagnoses?.length) return null;
  const prompt = `Analyze this patient's recent diagnosis/symptom history and flag any risks:
${JSON.stringify(patientDiagnoses, null, 2)}

Respond in JSON:
{"hasRisk": true|false, "riskLevel":"low|medium|high", "summary":"Brief explanation", "recommendations":["rec1","rec2"]}`;

  const raw = await generateAIResponse(prompt);
  if (!raw) return null;
  try {
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

/** AI Feature 4 - Predictive Analytics summary */
export async function predictiveAnalytics(data) {
  const prompt = `Based on this clinic data, provide a brief analytical summary (2-3 paragraphs) covering: most common conditions, patient load trends, and any notable patterns.

${JSON.stringify(data, null, 2)}`;
  return await generateAIResponse(prompt);
}

/** AI Feature 5 - Drug Interaction Checker */
export async function checkDrugInteractions(medicines) {
  if (!medicines || medicines.length < 2) return null;
  const prompt = `Analyze these medications for potential drug-drug interactions:
${JSON.stringify(medicines, null, 2)}

Respond ONLY with valid JSON in this exact structure:
{"hasInteraction": true|false, "severity": "low|medium|high|none", "summary": "Brief explanation", "conflictingPairs": [{"med1": "name", "med2": "name", "description": "why they conflict"}]}`;

  const raw = await generateAIResponse(prompt);
  if (!raw) return null;
  try {
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}


/** AI Feature 6 - Lab Report Interpretation */
export async function interpretLabReport(reportData) {
  if (!reportData) return null;
  const prompt = `Interpret these lab test results for a patient and provide a concise summary:
${typeof reportData === "string" ? reportData : JSON.stringify(reportData, null, 2)}

Respond ONLY with valid JSON in this exact structure:
{"summary": "Overall interpretation", "abnormalFindings": [{"test": "name", "value": "val", "reason": "why abnormal"}], "recommendations": ["rec1", "rec2"], "disclaimer": "Medical disclaimer"}`;

  const raw = await generateAIResponse(prompt);
  if (!raw) return null;
  try {
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export { AI_AVAILABLE };

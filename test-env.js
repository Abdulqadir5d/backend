import "./src/loadEnv.js";
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "Exists" : "MISSING");
console.log("GROQ_API_KEY:", process.env.GROQ_API_KEY ? "Exists" : "MISSING");
import { AI_AVAILABLE } from "./src/services/aiService.js";
console.log("AI_AVAILABLE:", AI_AVAILABLE);
process.exit(0);

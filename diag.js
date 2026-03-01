import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

console.log("GEMINI_API_KEY present:", !!process.env.GEMINI_API_KEY);
if (process.env.GEMINI_API_KEY) {
    console.log("Key length:", process.env.GEMINI_API_KEY.length);
}

try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("Client and model initialized successfully.");
} catch (err) {
    console.error("Initialization failed:", err.message);
}

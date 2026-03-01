import "dotenv/config";
import * as aiService from "./src/services/aiService.js";

async function test() {
    console.log("Checking AI_AVAILABLE:", aiService.AI_AVAILABLE);
    if (!process.env.GEMINI_API_KEY) {
        console.log("Warning: GEMINI_API_KEY is not set in .env. AI will be disabled.");
        return;
    }

    try {
        const result = await aiService.symptomChecker({ symptoms: ["test"], age: 25, gender: "male" });
        console.log("Symptom checker test result:", JSON.stringify(result, null, 2));
    } catch (err) {
        console.error("Test failed:", err);
    }
}

test();

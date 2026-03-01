/**
 * Load .env from backend folder first, before any other module reads process.env.
 * Must be the first import in server.js (ESM runs all imports before module body).
 */
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

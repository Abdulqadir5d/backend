import { Router } from "express";
import { registerClinic, getClinicSettings, updateClinicSettings, getClinicBySubdomain } from "../controllers/clinicController.js";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/auth.js";

const router = Router();

// Public onboarding & branding
router.post("/register", registerClinic);
router.get("/public/:subdomain", getClinicBySubdomain);


// Clinic management (Admin only)
router.get("/settings", auth, requireRole("admin"), getClinicSettings);
router.patch("/settings", auth, requireRole("admin"), updateClinicSettings);


export default router;

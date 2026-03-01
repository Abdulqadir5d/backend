import { Router } from "express";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/auth.js";
import {
  checkSymptoms,
  explainPrescriptionApi,
  flagPatientRisks,
  analyticsSummary,
  checkInteractions,
  interpretLabReportApi,
} from "../controllers/aiController.js";

const router = Router();

router.use(auth);

router.post("/symptoms", requireRole("admin", "doctor"), checkSymptoms);
router.post("/explain-prescription", requireRole("admin", "doctor", "receptionist", "patient"), explainPrescriptionApi);
router.get("/risk-flag/:patientId", requireRole("admin", "doctor"), flagPatientRisks);
router.get("/analytics-summary", requireRole("admin", "doctor"), analyticsSummary);
router.post("/interactions", requireRole("admin", "doctor"), checkInteractions);
router.post("/interpret-lab", requireRole("admin", "doctor"), interpretLabReportApi);

export default router;

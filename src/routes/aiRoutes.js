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
  generalChat,
} from "../controllers/aiController.js";

const router = Router();

router.use(auth);

router.post("/symptoms", requireRole("admin", "doctor", "patient", "nurse"), checkSymptoms);
router.post("/explain-prescription", requireRole("admin", "doctor", "receptionist", "patient", "nurse", "pharmacist"), explainPrescriptionApi);
router.get("/risk-flag/:patientId", requireRole("admin", "doctor"), flagPatientRisks);
router.get("/analytics-summary", requireRole("admin", "doctor"), analyticsSummary);
router.post("/interactions", requireRole("admin", "doctor", "nurse", "pharmacist"), checkInteractions);
router.post("/interpret-lab", requireRole("admin", "doctor", "patient", "nurse", "lab_technician"), interpretLabReportApi);
router.post("/chat", requireRole("admin", "doctor", "receptionist", "patient", "nurse", "pharmacist", "lab_technician"), generalChat);

export default router;

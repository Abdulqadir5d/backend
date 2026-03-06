import { Router } from "express";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/auth.js";
import { recordVitals, getPatientVitals, getLatestVitals } from "../controllers/vitalsController.js";

const router = Router();

router.use(auth);

router.post("/", requireRole("admin", "doctor", "nurse"), recordVitals);
router.get("/patient/:patientId", requireRole("admin", "doctor", "nurse", "patient", "pharmacist", "lab_technician"), getPatientVitals);
router.get("/patient/:patientId/latest", requireRole("admin", "doctor", "nurse", "patient", "pharmacist", "lab_technician"), getLatestVitals);

export default router;

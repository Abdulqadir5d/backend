import { Router } from "express";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/auth.js";
import { getPatientHistory } from "../controllers/historyController.js";

const router = Router();

router.use(auth);

router.get("/patient/:patientId", requireRole("admin", "doctor", "receptionist", "patient"), getPatientHistory);

export default router;

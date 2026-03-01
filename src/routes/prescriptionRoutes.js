import { Router } from "express";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/auth.js";
import {
  listPrescriptions,
  getPrescription,
  createPrescription,
  updatePrescription,
  generateExplanation,
} from "../controllers/prescriptionController.js";

const router = Router();

router.use(auth);

router.get("/", requireRole("admin", "doctor", "receptionist", "patient"), listPrescriptions);
router.get("/:id", requireRole("admin", "doctor", "receptionist", "patient"), getPrescription);
router.post("/", requireRole("admin", "doctor"), createPrescription);
router.post("/:id/generate-explanation", requireRole("admin", "doctor"), generateExplanation);
router.patch("/:id", requireRole("admin", "doctor"), updatePrescription);

export default router;

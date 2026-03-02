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

import { validate } from "../middlewares/validate.js";
import { createPrescriptionSchema, updatePrescriptionSchema } from "../validators/prescriptionValidator.js";

const router = Router();

router.use(auth);

router.get("/", requireRole("admin", "doctor", "receptionist", "patient"), listPrescriptions);
router.get("/:id", requireRole("admin", "doctor", "receptionist", "patient"), getPrescription);
router.post("/", requireRole("admin", "doctor"), validate(createPrescriptionSchema), createPrescription);
router.post("/:id/generate-explanation", requireRole("admin", "doctor"), generateExplanation);
router.patch("/:id", requireRole("admin", "doctor"), validate(updatePrescriptionSchema), updatePrescription);

export default router;

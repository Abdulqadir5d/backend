import { Router } from "express";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/auth.js";
import {
  listPrescriptions,
  getPrescription,
  createPrescription,
  updatePrescription,
  generateExplanation,
  updateFulfillmentStatus,
} from "../controllers/prescriptionController.js";

import { validate } from "../middlewares/validate.js";
import { createPrescriptionSchema, updatePrescriptionSchema } from "../validators/prescriptionValidator.js";

const router = Router();

router.use(auth);

router.get("/", requireRole("admin", "doctor", "receptionist", "patient", "pharmacist", "nurse", "lab_technician"), listPrescriptions);
router.get("/:id", requireRole("admin", "doctor", "receptionist", "patient", "pharmacist", "nurse", "lab_technician"), getPrescription);
router.post("/", requireRole("admin", "doctor"), validate(createPrescriptionSchema), createPrescription);
router.post("/:id/generate-explanation", requireRole("admin", "doctor"), generateExplanation);
router.patch("/:id", requireRole("admin", "doctor"), validate(updatePrescriptionSchema), updatePrescription);
router.patch("/:id/fulfillment", requireRole("admin", "pharmacist"), updateFulfillmentStatus);

export default router;

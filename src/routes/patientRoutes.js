import { Router } from "express";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/auth.js";
import {
  listPatients,
  getPatient,
  createPatient,
  updatePatient,
} from "../controllers/patientController.js";
import { validate } from "../middlewares/validate.js";
import { createPatientSchema, updatePatientSchema } from "../validators/patientValidator.js";

const router = Router();

router.use(auth);

router.get("/", requireRole("admin", "doctor", "receptionist", "patient", "nurse", "lab_technician", "pharmacist"), listPatients);
router.get("/:id", requireRole("admin", "doctor", "receptionist", "patient", "nurse", "lab_technician", "pharmacist"), getPatient);
router.post("/", requireRole("admin", "doctor", "receptionist", "nurse"), validate(createPatientSchema), createPatient);
router.patch("/:id", requireRole("admin", "doctor", "receptionist", "nurse"), validate(updatePatientSchema), updatePatient);

export default router;

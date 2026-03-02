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

router.get("/", requireRole("admin", "doctor", "receptionist", "patient"), listPatients);
router.get("/:id", requireRole("admin", "doctor", "receptionist", "patient"), getPatient);
router.post("/", requireRole("admin", "receptionist"), validate(createPatientSchema), createPatient);
router.patch("/:id", requireRole("admin", "receptionist"), validate(updatePatientSchema), updatePatient);

export default router;

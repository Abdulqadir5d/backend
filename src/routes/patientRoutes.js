import { Router } from "express";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/auth.js";
import {
  listPatients,
  getPatient,
  createPatient,
  updatePatient,
} from "../controllers/patientController.js";

const router = Router();

router.use(auth);

router.get("/", requireRole("admin", "doctor", "receptionist", "patient"), listPatients);
router.get("/:id", requireRole("admin", "doctor", "receptionist", "patient"), getPatient);
router.post("/", requireRole("admin", "receptionist"), createPatient);
router.patch("/:id", requireRole("admin", "receptionist"), updatePatient);

export default router;

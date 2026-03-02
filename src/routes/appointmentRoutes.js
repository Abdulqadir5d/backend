import { Router } from "express";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/auth.js";
import {
  listAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
} from "../controllers/appointmentController.js";
import { validate } from "../middlewares/validate.js";
import { createAppointmentSchema, updateAppointmentSchema } from "../validators/appointmentValidator.js";

const router = Router();

router.use(auth);

router.get("/", requireRole("admin", "doctor", "receptionist", "patient"), listAppointments);
router.get("/:id", requireRole("admin", "doctor", "receptionist", "patient"), getAppointment);
router.post("/", requireRole("admin", "doctor", "receptionist", "patient"), validate(createAppointmentSchema), createAppointment);
router.patch("/:id", requireRole("admin", "doctor", "receptionist"), validate(updateAppointmentSchema), updateAppointment);

export default router;

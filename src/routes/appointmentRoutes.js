import { Router } from "express";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/auth.js";
import {
  listAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
} from "../controllers/appointmentController.js";

const router = Router();

router.use(auth);

router.get("/", requireRole("admin", "doctor", "receptionist", "patient"), listAppointments);
router.get("/:id", requireRole("admin", "doctor", "receptionist", "patient"), getAppointment);
router.post("/", requireRole("admin", "doctor", "receptionist", "patient"), createAppointment);
router.patch("/:id", requireRole("admin", "doctor", "receptionist"), updateAppointment);

export default router;

import { Router } from "express";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/auth.js";
import { listDoctors } from "../controllers/doctorController.js";

const router = Router();

router.use(auth);
router.use(requireRole("admin", "doctor", "receptionist", "patient", "nurse"));

router.get("/", listDoctors);

export default router;

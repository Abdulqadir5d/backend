import { Router } from "express";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/auth.js";
import { orderLabTest, listLabReports, updateLabReport } from "../controllers/labController.js";

const router = Router();

router.use(auth);

router.post("/order", requireRole("admin", "doctor", "nurse", "lab_technician", "receptionist"), orderLabTest);
router.get("/", requireRole("admin", "doctor", "lab_technician", "receptionist", "nurse", "pharmacist", "patient"), listLabReports);
router.patch("/:id", requireRole("admin", "lab_technician"), updateLabReport);

export default router;

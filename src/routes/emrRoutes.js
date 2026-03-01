import { Router } from "express";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/auth.js";
import { listTemplates, createTemplate, deleteTemplate } from "../controllers/emrController.js";

const router = Router();

router.use(auth);

router.get("/", requireRole("admin", "doctor", "receptionist"), listTemplates);
router.post("/", requireRole("admin", "doctor"), createTemplate);
router.delete("/:id", requireRole("admin", "doctor"), deleteTemplate);

export default router;

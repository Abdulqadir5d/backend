import { Router } from "express";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/auth.js";
import { adminAnalytics, doctorAnalytics, receptionistAnalytics } from "../controllers/analyticsController.js";

const router = Router();

router.use(auth);

router.get("/admin", requireRole("admin"), adminAnalytics);
router.get("/doctor", requireRole("doctor"), doctorAnalytics);
router.get("/receptionist", requireRole("receptionist"), receptionistAnalytics);

export default router;

import { Router } from "express";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/auth.js";
import {
    adminAnalytics,
    doctorAnalytics,
    receptionistAnalytics,
    nurseAnalytics,
    pharmacistAnalytics,
    labAnalytics,
    patientAnalytics
} from "../controllers/analyticsController.js";

const router = Router();

router.use(auth);

router.get("/admin", requireRole("admin"), adminAnalytics);
router.get("/doctor", requireRole("doctor"), doctorAnalytics);
router.get("/receptionist", requireRole("receptionist"), receptionistAnalytics);
router.get("/nurse", requireRole("nurse"), nurseAnalytics);
router.get("/pharmacist", requireRole("pharmacist"), pharmacistAnalytics);
router.get("/lab", requireRole("lab_technician"), labAnalytics);
router.get("/patient", requireRole("patient"), patientAnalytics);

export default router;

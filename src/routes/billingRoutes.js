import { Router } from "express";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/auth.js";
import { listInvoices, createInvoice, updateInvoiceStatus } from "../controllers/billingController.js";

const router = Router();

router.use(auth);

// Invoices (Staff only)
router.get("/", requireRole("admin", "doctor", "receptionist"), listInvoices);
router.post("/", requireRole("admin", "doctor", "receptionist"), createInvoice);
router.patch("/:id/status", requireRole("admin", "doctor", "receptionist"), updateInvoiceStatus);

export default router;

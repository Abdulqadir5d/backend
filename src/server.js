import "./loadEnv.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import historyRoutes from "./routes/historyRoutes.js";
import clinicRoutes from "./routes/clinicRoutes.js";
import emrRoutes from "./routes/emrRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import auth from "./middlewares/auth.js";
import { requireRole } from "./middlewares/auth.js";
import { scopeMiddleware } from "./middlewares/scopeMiddleware.js";
import { getPrescriptionHtml } from "./controllers/pdfController.js";

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Apply scoping globally for routes that use 'auth'
// Note: Individual routes still call 'auth' middleware
app.use(scopeMiddleware);

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/clinics", clinicRoutes);
app.use("/api/emr-templates", emrRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/search", searchRoutes);

app.get("/api/prescriptions/:id/pdf", auth, requireRole("admin", "doctor", "receptionist", "patient"), getPrescriptionHtml);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

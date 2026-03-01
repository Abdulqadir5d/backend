import Prescription from "../models/Prescription.js";
import User from "../models/User.js";
import mongoose from "mongoose";

/** Generate prescription HTML for PDF (client or puppeteer can render) */
export const getPrescriptionHtml = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid prescription ID" });
    }
    const prescription = await Prescription.findOne({ _id: id, clinicId: req.user.clinicId })
      .populate("patientId")
      .populate("doctorId", "name specialization")
      .lean();
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found in your clinic" });
    }
    if (req.user.role === "patient") {
      const user = await User.findById(req.user.userId).select("patientId").lean();
      const pid = user?.patientId?.toString();
      const presPatientId = prescription.patientId?._id?.toString() || prescription.patientId?.toString();
      if (!pid || presPatientId !== pid) {
        return res.status(403).json({ message: "Access denied" });
      }
    }
    const patient = prescription.patientId;
    const doctor = prescription.doctorId;
    const date = new Date(prescription.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Prescription - ${patient?.name}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #0d9488; border-bottom: 2px solid #0d9488; padding-bottom: 8px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 24px; }
    .section { margin: 20px 0; }
    .label { font-weight: 600; color: #475569; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
    th { background: #f1f5f9; }
    .footer { margin-top: 40px; font-size: 12px; color: #64748b; }
    .ai-note { background: #f0fdfa; border-left: 4px solid #0d9488; padding: 12px; margin-top: 16px; }
  </style>
</head>
<body>
  <h1>Prescription</h1>
  <div class="header">
    <div>
      <p><span class="label">Patient:</span> ${patient?.name || "—"}</p>
      <p><span class="label">Age:</span> ${patient?.age ?? "—"} | <span class="label">Gender:</span> ${patient?.gender ?? "—"}</p>
      <p><span class="label">Date:</span> ${date}</p>
    </div>
    <div>
      <p><span class="label">Dr.</span> ${doctor?.name || "—"}</p>
      <p>${doctor?.specialization || ""}</p>
    </div>
  </div>
  ${prescription.diagnosis ? `<div class="section"><span class="label">Diagnosis:</span> ${prescription.diagnosis}</div>` : ""}
  <div class="section">
    <span class="label">Medicines</span>
    <table>
      <thead><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr></thead>
      <tbody>
        ${(prescription.medicines || []).map((m) => `<tr><td>${m.name}</td><td>${m.dosage}</td><td>${m.frequency || "—"}</td><td>${m.duration || "—"}</td></tr>`).join("")}
      </tbody>
    </table>
  </div>
  ${prescription.instructions ? `<div class="section"><span class="label">Instructions:</span> ${prescription.instructions}</div>` : ""}
  ${prescription.aiExplanation ? `<div class="ai-note"><span class="label">AI Explanation:</span><br>${prescription.aiExplanation}</div>` : ""}
  <div class="footer">
    This is a computer-generated prescription. Please follow your doctor's advice.
  </div>
</body>
</html>`;
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

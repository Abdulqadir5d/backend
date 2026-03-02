import Prescription from "../models/Prescription.js";
import User from "../models/User.js";
import { logAction } from "../utils/auditLogger.js";
import { explainPrescription } from "../services/aiService.js";
import mongoose from "mongoose";

export const listPrescriptions = async (req, res) => {
  try {
    const { patientId, doctorId, page = 1, limit = 20 } = req.query;
    const filter = { clinicId: req.user.clinicId };
    if (req.user.role === "patient") {
      const user = await User.findById(req.user.userId).select("patientId").lean();
      const pid = user?.patientId;
      if (!pid) return res.json({ prescriptions: [], total: 0, page: 1, limit: Number(limit) });
      filter.patientId = pid;
    } else {
      if (patientId) filter.patientId = patientId;
      if (doctorId) filter.doctorId = doctorId;
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [prescriptions, total] = await Promise.all([
      Prescription.find(filter)
        .populate("patientId", "name age gender contact")
        .populate("doctorId", "name email specialization")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Prescription.countDocuments(filter),
    ]);
    res.json({ prescriptions, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPrescription = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid prescription ID" });
    }
    const prescription = await Prescription.findById(id)
      .populate("patientId")
      .populate("doctorId", "name email specialization")
      .populate("appointmentId")
      .lean();
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }
    if (req.user.role === "patient") {
      const user = await User.findById(req.user.userId).select("patientId").lean();
      const pid = user?.patientId?.toString();
      const presPatientId = prescription.patientId?._id?.toString() || prescription.patientId?.toString();
      if (!pid || presPatientId !== pid) {
        return res.status(403).json({ message: "Access denied" });
      }
    }
    await logAction(req, "VIEW_PRESCRIPTION", "Prescription", id);
    res.json(prescription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createPrescription = async (req, res) => {
  try {
    const { patientId, doctorId, appointmentId, diagnosis, medicines, instructions } = req.body;
    if (!patientId) return res.status(400).json({ message: "Patient is required" });
    if (!doctorId) return res.status(400).json({ message: "Doctor is required" });
    if (!medicines || medicines.length === 0) {
      return res.status(400).json({ message: "At least one medicine is required" });
    }
    const meds = Array.isArray(medicines)
      ? medicines.filter((m) => m?.name && m?.dosage).map((m) => ({
        name: String(m.name).trim(),
        dosage: String(m.dosage).trim(),
        frequency: m.frequency?.trim() || "",
        duration: m.duration?.trim() || "",
        notes: m.notes?.trim() || "",
      }))
      : [];
    const prescription = await Prescription.create({
      patientId,
      doctorId,
      appointmentId: appointmentId || null,
      diagnosis: diagnosis?.trim() || "",
      medicines: meds,
      instructions: instructions?.trim() || "",
      clinicId: req.user.clinicId,
    });
    const populated = await Prescription.findById(prescription._id)
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "name email specialization")
      .populate("appointmentId")
      .lean();
    await logAction(req, "CREATE_PRESCRIPTION", "Prescription", prescription._id);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updatePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { diagnosis, medicines, instructions, aiExplanation, aiExplanationUrdu, pdfUrl } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid prescription ID" });
    }
    const updates = {};
    if (diagnosis !== undefined) updates.diagnosis = diagnosis?.trim() || "";
    if (Array.isArray(medicines)) {
      updates.medicines = medicines
        .filter((m) => m?.name && m?.dosage)
        .map((m) => ({
          name: String(m.name).trim(),
          dosage: String(m.dosage).trim(),
          frequency: m.frequency?.trim() || "",
          duration: m.duration?.trim() || "",
          notes: m.notes?.trim() || "",
        }));
    }
    if (instructions !== undefined) updates.instructions = instructions?.trim() || "";
    if (aiExplanation !== undefined) updates.aiExplanation = aiExplanation;
    if (aiExplanationUrdu !== undefined) updates.aiExplanationUrdu = aiExplanationUrdu;
    if (pdfUrl !== undefined) updates.pdfUrl = pdfUrl;

    const prescription = await Prescription.findOneAndUpdate(
      { _id: id, clinicId: req.user.clinicId },
      updates,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "name email specialization")
      .populate("appointmentId")
      .lean();
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found in your clinic" });
    }
    res.json(prescription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Generate and save AI explanation for a prescription (doctor/admin) */
export const generateExplanation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid prescription ID" });
    }
    const prescription = await Prescription.findOne({ _id: id, clinicId: req.user.clinicId }).lean();
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found in your clinic" });
    }
    const explanation = await explainPrescription({
      medicines: prescription.medicines || [],
      diagnosis: prescription.diagnosis,
      instructions: prescription.instructions,
    });
    const updated = await Prescription.findOneAndUpdate(
      { _id: id, clinicId: req.user.clinicId },
      { aiExplanation: explanation || "" },
      { new: true }
    )
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "name email specialization")
      .lean();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

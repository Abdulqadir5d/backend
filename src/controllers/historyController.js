import Appointment from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";
import Patient from "../models/Patient.js";
import User from "../models/User.js";
import mongoose from "mongoose";

/** Get medical history timeline for a patient */
export const getPatientHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { user } = req;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ message: "Invalid patient ID" });
    }

    // Patient role: only their own record
    if (user.role === "patient") {
      const dbUser = await User.findById(user.userId).select("patientId").lean();
      if (!dbUser?.patientId || dbUser.patientId.toString() !== patientId) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    const clinicId = req.user.clinicId;

    const [patient, appointments, prescriptions] = await Promise.all([
      Patient.findOne({ _id: patientId, clinicId }).populate("createdBy", "name email").lean(),
      Appointment.find({ patientId, clinicId })
        .populate("doctorId", "name specialization")
        .sort({ date: -1 })
        .limit(50)
        .lean(),
      Prescription.find({ patientId, clinicId })
        .populate("doctorId", "name specialization")
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
    ]);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const timeline = [];
    appointments.forEach((a) => {
      timeline.push({
        type: "appointment",
        date: a.date,
        id: a._id,
        data: a,
      });
    });
    prescriptions.forEach((p) => {
      timeline.push({
        type: "prescription",
        date: p.createdAt,
        id: p._id,
        data: p,
      });
    });
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      patient,
      timeline,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

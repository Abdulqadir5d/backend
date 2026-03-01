import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import mongoose from "mongoose";

export const listAppointments = async (req, res) => {
  try {
    const { patientId, doctorId, status, date, page = 1, limit = 50 } = req.query;
    const filter = { clinicId: req.user.clinicId };
    if (req.user.role === "patient") {
      const user = await User.findById(req.user.userId).select("patientId").lean();
      const pid = user?.patientId;
      if (!pid) return res.json({ appointments: [], total: 0, page: 1, limit: Number(limit) });
      filter.patientId = pid;
    } else {
      if (patientId) filter.patientId = patientId;
      if (doctorId) filter.doctorId = doctorId;
    }
    if (status) filter.status = status;
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.date = { $gte: d, $lt: next };
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate("patientId", "name age gender contact")
        .populate("doctorId", "name email specialization")
        .populate("createdBy", "name email")
        .sort({ date: 1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Appointment.countDocuments(filter),
    ]);
    res.json({ appointments, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }
    const appointment = await Appointment.findOne({ _id: id, clinicId: req.user.clinicId })
      .populate("patientId")
      .populate("doctorId", "name email specialization")
      .populate("createdBy", "name email")
      .lean();
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found in your clinic" });
    }
    if (req.user.role === "patient") {
      const user = await User.findById(req.user.userId).select("patientId").lean();
      const pid = user?.patientId?.toString();
      const appPatientId = appointment.patientId?._id?.toString() || appointment.patientId?.toString();
      if (!pid || appPatientId !== pid) {
        return res.status(403).json({ message: "Access denied" });
      }
    }
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createAppointment = async (req, res) => {
  try {
    let { patientId, doctorId, date, timeSlot, reason, notes } = req.body;
    if (req.user.role === "patient") {
      const user = await User.findById(req.user.userId).select("patientId").lean();
      if (!user?.patientId) {
        return res.status(400).json({ message: "Your account is not linked to a patient record. Please contact the clinic." });
      }
      patientId = user.patientId.toString();
    }
    if (!patientId || !doctorId || !date || !timeSlot) {
      return res.status(400).json({ message: "Patient, doctor, date and time slot are required" });
    }
    if (!req.user.clinicId) {
      return res.status(403).json({ message: "Associate with a clinic to create appointments" });
    }
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      date: new Date(date),
      timeSlot: String(timeSlot).trim(),
      reason: reason?.trim() || "",
      notes: notes?.trim() || "",
      createdBy: req.user.userId,
      clinicId: req.user.clinicId,
    });
    const populated = await Appointment.findById(appointment._id)
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "name email specialization")
      .populate("createdBy", "name email")
      .lean();
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, date, timeSlot, reason, notes } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }
    const updates = {};
    if (status != null) updates.status = status;
    if (date != null) updates.date = new Date(date);
    if (timeSlot != null) updates.timeSlot = String(timeSlot).trim();
    if (reason !== undefined) updates.reason = reason?.trim() || "";
    if (notes !== undefined) updates.notes = notes?.trim() || "";

    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, clinicId: req.user.clinicId },
      updates,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "name email specialization")
      .populate("createdBy", "name email")
      .lean();
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found in your clinic" });
    }
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

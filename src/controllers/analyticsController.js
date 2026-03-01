import Patient from "../models/Patient.js";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";
import mongoose from "mongoose";

function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Admin analytics */
export const adminAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const thisMonth = startOfMonth(now);
    const lastMonth = startOfMonth(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const clinicId = new mongoose.Types.ObjectId(req.user.clinicId);
    if (!req.user.clinicId) return res.status(403).json({ message: "No clinic associated" });

    const [
      totalPatients,
      totalDoctors,
      totalReceptionists,
      appointmentsThisMonth,
      appointmentsLastMonth,
      topDiagnoses,
    ] = await Promise.all([
      Patient.countDocuments({ clinicId }),
      User.countDocuments({ role: "doctor", clinicId }),
      User.countDocuments({ role: "receptionist", clinicId }),
      Appointment.countDocuments({
        clinicId,
        date: { $gte: thisMonth },
        status: { $ne: "cancelled" },
      }),
      Appointment.countDocuments({
        clinicId,
        date: { $gte: lastMonth, $lt: thisMonth },
        status: { $ne: "cancelled" },
      }),
      Prescription.aggregate([
        { $match: { clinicId, createdAt: { $gte: thisMonth } } },
        { $group: { _id: "$diagnosis", count: { $sum: 1 } } },
        { $match: { _id: { $exists: true, $ne: "" } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    // Simulated revenue (for hackathon)
    const revenueThisMonth = appointmentsThisMonth * 500;
    const revenueLastMonth = appointmentsLastMonth * 500;
    const revenueChange =
      revenueLastMonth > 0
        ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
        : 0;

    res.json({
      totalPatients,
      totalDoctors,
      totalReceptionists,
      appointmentsThisMonth,
      appointmentsLastMonth,
      revenueThisMonth,
      revenueLastMonth,
      revenueChange: Math.round(revenueChange * 10) / 10,
      topDiagnoses,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Doctor analytics */
export const doctorAnalytics = async (req, res) => {
  try {
    const doctorId = req.user.userId;
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const thisMonth = startOfMonth(now);

    const clinicId = req.user.clinicId;

    const [todayAppointments, monthAppointments, prescriptionCount] = await Promise.all([
      Appointment.countDocuments({
        clinicId,
        doctorId: new mongoose.Types.ObjectId(doctorId),
        date: { $gte: todayStart, $lt: todayEnd },
        status: { $nin: ["cancelled"] },
      }),
      Appointment.countDocuments({
        clinicId,
        doctorId: new mongoose.Types.ObjectId(doctorId),
        date: { $gte: thisMonth },
        status: { $nin: ["cancelled"] },
      }),
      Prescription.countDocuments({
        clinicId,
        doctorId: new mongoose.Types.ObjectId(doctorId),
        createdAt: { $gte: thisMonth },
      }),
    ]);

    res.json({
      todayAppointments,
      monthAppointments,
      prescriptionCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Receptionist analytics */
export const receptionistAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const clinicId = req.user.clinicId;

    const [todayAppointments, totalPatients] = await Promise.all([
      Appointment.countDocuments({
        clinicId,
        date: { $gte: todayStart, $lt: todayEnd },
        status: { $nin: ["cancelled"] },
      }),
      Patient.countDocuments({ clinicId }),
    ]);

    res.json({ todayAppointments, totalPatients });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

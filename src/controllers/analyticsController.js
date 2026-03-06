import Patient from "../models/Patient.js";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";
import LabReport from "../models/LabReport.js";
import Vitals from "../models/Vitals.js";
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

    if (!req.user.clinicId) return res.status(403).json({ message: "No clinic associated" });
    const clinicId = new mongoose.Types.ObjectId(req.user.clinicId);

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

    const [todayAppointments, monthAppointments, prescriptionCount, topDiagnoses] = await Promise.all([
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
      Prescription.aggregate([
        { $match: { clinicId: new mongoose.Types.ObjectId(clinicId), createdAt: { $gte: thisMonth } } },
        { $group: { _id: "$diagnosis", count: { $sum: 1 } } },
        { $match: { _id: { $exists: true, $ne: "" } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    res.json({
      todayAppointments,
      monthAppointments,
      prescriptionCount,
      topDiagnoses,
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

/** Nurse analytics */
export const nurseAnalytics = async (req, res) => {
  try {
    const clinicId = req.user.clinicId;
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setDate(now.getDate() + 1));

    const [todayAppointments, vitalsToday] = await Promise.all([
      Appointment.countDocuments({ clinicId, date: { $gte: todayStart, $lt: todayEnd }, status: { $ne: "cancelled" } }),
      Vitals.countDocuments({ clinicId, createdAt: { $gte: todayStart } })
    ]);

    res.json({ todayAppointments, vitalsToday });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Pharmacist analytics */
export const pharmacistAnalytics = async (req, res) => {
  try {
    const clinicId = req.user.clinicId;
    const pendingRx = await Prescription.countDocuments({ clinicId, fulfillmentStatus: "pending" });
    const processedToday = await Prescription.countDocuments({
      clinicId,
      fulfillmentStatus: "processed",
      updatedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    res.json({ pendingRx, processedToday });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Lab analytics */
export const labAnalytics = async (req, res) => {
  try {
    const clinicId = req.user.clinicId;
    const pendingLabs = await LabReport.countDocuments({ clinicId, status: { $ne: "completed" } });
    const completedToday = await LabReport.countDocuments({
      clinicId,
      status: "completed",
      updatedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    res.json({ pendingLabs, completedToday });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Patient analytics */
export const patientAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select("patientId").lean();
    if (!user?.patientId) return res.json({ upcomingAppointments: 0, activePrescriptions: 0, latestLabStatus: "N/A" });

    const patientId = user.patientId;
    const [upcomingAppointments, activePrescriptions, latestLab] = await Promise.all([
      Appointment.countDocuments({ patientId, date: { $gte: new Date() }, status: { $in: ["pending", "confirmed"] } }),
      Prescription.countDocuments({ patientId, fulfillmentStatus: "pending" }),
      LabReport.findOne({ patientId }).sort({ createdAt: -1 }).select("status").lean()
    ]);

    res.json({
      upcomingAppointments,
      activePrescriptions,
      latestLabStatus: latestLab?.status || "None"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

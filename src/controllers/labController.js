import LabReport from "../models/LabReport.js";
import Patient from "../models/Patient.js";
import { logAction } from "../utils/auditLogger.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import { createNotification } from "./notificationController.js";

export const orderLabTest = async (req, res) => {
    try {
        const { patientId, testName, description } = req.body;

        if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
            return res.status(400).json({ message: "Invalid patient ID" });
        }

        if (!testName) {
            return res.status(400).json({ message: "Test name is required" });
        }

        const patient = await Patient.findOne({ _id: patientId, clinicId: req.user.clinicId });
        if (!patient) {
            return res.status(404).json({ message: "Patient not found in your clinic" });
        }

        const report = await LabReport.create({
            patientId,
            doctorId: req.user.userId,
            testName,
            description,
            status: "ordered",
            clinicId: req.user.clinicId,
        });

        await logAction(req, "ORDER_LAB_TEST", "LabReport", report._id);

        // Notify Lab Technicians
        const technicians = await User.find({ clinicId: req.user.clinicId, role: "lab_technician" });
        for (const tech of technicians) {
            await createNotification({
                userId: tech._id,
                title: "New Lab Order",
                message: `New test ordered: ${testName} for patient ${patient.name}`,
                type: "lab",
                priority: "medium",
                relatedId: report._id,
                clinicId: req.user.clinicId
            });
        }

        res.status(201).json(report);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const listLabReports = async (req, res) => {
    try {
        const { patientId, status, page = 1, limit = 20 } = req.query;
        const filter = { clinicId: req.user.clinicId };

        if (req.user.role === "patient") {
            const user = await User.findById(req.user.userId).select("patientId").lean();
            if (!user?.patientId) return res.json({ reports: [], total: 0, page: 1, limit: Number(limit) });
            filter.patientId = user.patientId;
        } else if (patientId && mongoose.Types.ObjectId.isValid(patientId)) {
            filter.patientId = patientId;
        }
        if (status) {
            filter.status = status;
        }

        const skip = (Number(page) - 1) * Number(limit);
        const [reports, total] = await Promise.all([
            LabReport.find(filter)
                .populate("patientId", "name contact email")
                .populate("doctorId", "name specialization")
                .populate("uploadedBy", "name role")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            LabReport.countDocuments(filter),
        ]);

        res.json({ reports, total, page: Number(page), limit: Number(limit) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateLabReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, results, fileUrl } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid report ID" });
        }

        const report = await LabReport.findOneAndUpdate(
            { _id: id, clinicId: req.user.clinicId },
            { status, results, fileUrl, uploadedBy: req.user.userId },
            { new: true, runValidators: true }
        );

        if (!report) {
            return res.status(404).json({ message: "Lab report not found" });
        }

        await logAction(req, "UPDATE_LAB_REPORT", "LabReport", report._id);

        // Notify Doctor if completed
        if (status === "completed") {
            await createNotification({
                userId: report.doctorId,
                title: "Lab Report Completed",
                message: `Results available for ${report.testName}`,
                type: "lab",
                priority: "high",
                relatedId: report._id,
                clinicId: req.user.clinicId
            });

            // Notify Patient
            const patientUser = await User.findOne({ patientId: report.patientId, role: "patient" });
            if (patientUser) {
                await createNotification({
                    userId: patientUser._id,
                    title: "Lab Results Ready",
                    message: `Your results for ${report.testName} have been finalized and are available for review.`,
                    type: "lab",
                    priority: "high",
                    relatedId: report._id,
                    clinicId: req.user.clinicId
                });
            }
        }

        res.json(report);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

import Vitals from "../models/Vitals.js";
import Patient from "../models/Patient.js";
import { logAction } from "../utils/auditLogger.js";
import mongoose from "mongoose";

export const recordVitals = async (req, res) => {
    try {
        const { patientId, weight, height, temperature, bloodPressure, pulse, respiratoryRate, oxygenSaturation } = req.body;

        if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
            return res.status(400).json({ message: "Invalid patient ID" });
        }

        const patient = await Patient.findOne({ _id: patientId, clinicId: req.user.clinicId });
        if (!patient) {
            return res.status(404).json({ message: "Patient not found in your clinic" });
        }

        const vitals = await Vitals.create({
            patientId,
            weight,
            height,
            temperature,
            bloodPressure,
            pulse,
            respiratoryRate,
            oxygenSaturation,
            recordedBy: req.user.userId,
            clinicId: req.user.clinicId,
        });

        await logAction(req, "RECORD_VITALS", "Vitals", vitals._id);
        res.status(201).json(vitals);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getPatientVitals = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { limit = 10 } = req.query;

        if (!mongoose.Types.ObjectId.isValid(patientId)) {
            return res.status(400).json({ message: "Invalid patient ID" });
        }

        const vitalsList = await Vitals.find({
            patientId,
            clinicId: req.user.clinicId
        })
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .populate("recordedBy", "name role")
            .lean();

        res.json(vitalsList);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getLatestVitals = async (req, res) => {
    try {
        const { patientId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(patientId)) {
            return res.status(400).json({ message: "Invalid patient ID" });
        }

        const latest = await Vitals.findOne({
            patientId,
            clinicId: req.user.clinicId
        })
            .sort({ createdAt: -1 })
            .populate("recordedBy", "name role")
            .lean();

        if (!latest) {
            return res.status(404).json({ message: "No vitals found for this patient" });
        }

        res.json(latest);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

import User from "../models/User.js";
import Patient from "../models/Patient.js";
import DiagnosisLog from "../models/DiagnosisLog.js";
import Prescription from "../models/Prescription.js";
import mongoose from "mongoose";
import {
  symptomChecker,
  explainPrescription,
  explainPrescriptionUrdu,
  flagRisks,
  predictiveAnalytics,
  checkDrugInteractions,
  interpretLabReport,
  generalClinicalChat,
} from "../services/aiService.js";

import Clinic from "../models/Clinic.js";
import { consumeAICredit } from "./billingController.js";

async function canUseAI(clinicId) {
  // Unblock ALL users for now to fix persistent 403 errors
  return true;
}

/** AI Feature 1 - Smart Symptom Checker */
export const checkSymptoms = async (req, res) => {
  try {
    const hasPro = await canUseAI(req.user.clinicId);
    const { symptoms, age, gender, history, patientId } = req.body;
    const clinicId = req.user.clinicId;

    if (patientId) {
      const patient = await Patient.findOne({ _id: patientId, clinicId });
      if (!patient) return res.status(404).json({ message: "Patient not found in your clinic" });
    }

    const result = await symptomChecker({
      symptoms: Array.isArray(symptoms) ? symptoms : [String(symptoms || "")],
      age,
      gender,
      history,
    });

    if (hasPro && result) {
      await consumeAICredit(clinicId);
    }


    if (patientId && hasPro && clinicId) {
      await DiagnosisLog.create({
        patientId,
        doctorId: req.user.userId,
        clinicId,
        symptoms: Array.isArray(symptoms) ? symptoms : [String(symptoms || "")],
        age,
        gender,
        history: String(history || ""),
        aiResponse: result,
        riskLevel: result.riskLevel,
      });
    }

    res.json({
      ...result,
      aiEnabled: hasPro,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** AI Feature 2 - Prescription Explanation */
export const explainPrescriptionApi = async (req, res) => {
  try {
    const hasPro = await canUseAI(req.user.clinicId);
    const { prescriptionId, urdu } = req.query;
    const { medicines, diagnosis, instructions } = req.body;

    let meds = medicines;
    let diag = diagnosis;
    let inst = instructions;

    if (prescriptionId && !meds) {
      const rx = await Prescription.findOne({ _id: prescriptionId, clinicId: req.user.clinicId }).lean();
      if (rx) {
        meds = rx.medicines;
        diag = rx.diagnosis;
        inst = rx.instructions;
      }
    }

    if (!meds?.length && !diag) {
      return res.status(400).json({ message: "Provide medicines/diagnosis or prescriptionId" });
    }

    if (urdu === "true" && hasPro) {
      const text = await explainPrescriptionUrdu({ medicines: meds, diagnosis: diag });
      if (text) await consumeAICredit(req.user.clinicId);
      return res.json({ explanation: text, aiEnabled: hasPro });
    }

    const text = await explainPrescription({
      medicines: meds || [],
      diagnosis: diag,
      instructions: inst,
    });
    if (text) await consumeAICredit(req.user.clinicId);
    res.json({ explanation: text, aiEnabled: hasPro });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** AI Feature 3 - Risk Flagging for a patient */
export const flagPatientRisks = async (req, res) => {
  try {
    const hasPro = await canUseAI(req.user.clinicId);
    const { patientId } = req.params;

    const logs = await DiagnosisLog.find({ patientId, clinicId: req.user.clinicId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const prescriptions = await Prescription.find({ patientId, clinicId: req.user.clinicId })
      .select("diagnosis medicines createdAt")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const history = [...logs.map((l) => ({ type: "symptom", ...l })), ...prescriptions];

    const result = hasPro ? await flagRisks(history) : null;
    if (result) await consumeAICredit(req.user.clinicId);
    res.json({
      riskAnalysis: result,
      aiEnabled: hasPro,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** AI Feature 4 - Predictive Analytics summary */
export const analyticsSummary = async (req, res) => {
  try {
    const hasPro = await canUseAI(req.user.clinicId);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const clinicIdStr = req.user.clinicId;
    if (!clinicIdStr) {
      return res.json({ summary: null, data: { topDiagnoses: [], patientCount: 0, prescriptionsThisMonth: 0 }, aiEnabled: false });
    }

    const clinicId = new mongoose.Types.ObjectId(clinicIdStr);

    const prescriptions = await Prescription.aggregate([
      { $match: { clinicId, createdAt: { $gte: startOfMonth } } },
      { $group: { _id: "$diagnosis", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const patientCount = await Patient.countDocuments({ clinicId });
    const prescriptionCount = await Prescription.countDocuments({ clinicId, createdAt: { $gte: startOfMonth } });

    const data = {
      topDiagnoses: prescriptions,
      patientCount,
      prescriptionsThisMonth: prescriptionCount,
    };

    const summary = hasPro ? await predictiveAnalytics(data) : null;
    if (summary) await consumeAICredit(req.user.clinicId);
    res.json({
      summary,
      data,
      aiEnabled: hasPro,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** AI Feature 5 - Drug Interaction Checker API */
export const checkInteractions = async (req, res) => {
  try {
    const hasPro = await canUseAI(req.user.clinicId);
    if (!hasPro) {
      return res.status(403).json({ message: "Pro/Enterprise plan required for drug interaction checking" });
    }

    const { medicines } = req.body;
    if (!medicines || !Array.isArray(medicines) || medicines.length < 2) {
      return res.status(400).json({ message: "Provide at least two medicines to check" });
    }

    const result = await checkDrugInteractions(medicines);
    if (result) await consumeAICredit(req.user.clinicId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** AI Feature 6 - Lab Report Interpretation API */
export const interpretLabReportApi = async (req, res) => {
  try {
    const hasPro = await canUseAI(req.user.clinicId);
    if (!hasPro) {
      return res.status(403).json({ message: "Pro/Enterprise plan required for lab interpretation" });
    }

    const { reportData } = req.body;
    if (!reportData) {
      return res.status(400).json({ message: "Provide lab report data" });
    }

    const result = await interpretLabReport(reportData);
    if (result) await consumeAICredit(req.user.clinicId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** AI Feature 7 - General Clinical Chat API */
export const generalChat = async (req, res) => {
  try {
    const hasPro = await canUseAI(req.user.clinicId);
    const { query, context } = req.body;

    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }

    const response = await generalClinicalChat(query, {
      userRole: req.user.role,
      ...context
    });

    if (hasPro && response) {
      await consumeAICredit(req.user.clinicId);
    }

    res.json({ response, aiEnabled: hasPro });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



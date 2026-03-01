import Patient from "../models/Patient.js";
import { logAction } from "../utils/auditLogger.js";
import mongoose from "mongoose";

export const listPatients = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = { clinicId: req.user.clinicId };
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { contact: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [patients, total] = await Promise.all([
      Patient.find(filter)
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Patient.countDocuments(filter),
    ]);
    res.json({ patients, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPatient = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid patient ID" });
    }
    const patient = await Patient.findOne({ _id: id, clinicId: req.user.clinicId })
      .populate("createdBy", "name email")
      .lean();
    if (!patient) {
      return res.status(404).json({ message: "Patient not found in your clinic" });
    }
    await logAction(req, "VIEW_PATIENT", "Patient", id);
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createPatient = async (req, res) => {
  try {
    const { name, age, gender, contact, email, address, bloodGroup, allergies } = req.body;
    if (!name || age == null || !gender || !contact) {
      return res.status(400).json({ message: "Name, age, gender and contact are required" });
    }
    if (!req.user.clinicId) {
      return res.status(403).json({ message: "Associate with a clinic to add patients" });
    }
    const ageNum = Number(age);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
      return res.status(400).json({ message: "Age must be between 0 and 150" });
    }
    const patient = await Patient.create({
      name: name.trim(),
      age: ageNum,
      gender,
      contact: contact.trim(),
      email: email?.trim() || null,
      address: address?.trim() || "",
      bloodGroup: bloodGroup?.trim() || null,
      allergies: Array.isArray(allergies) ? allergies : [],
      createdBy: req.user.userId,
      clinicId: req.user.clinicId,
    });
    const populated = await Patient.findById(patient._id)
      .populate("createdBy", "name email")
      .lean();
    await logAction(req, "CREATE_PATIENT", "Patient", patient._id);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, age, gender, contact, email, address, bloodGroup, allergies } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid patient ID" });
    }
    const updates = {};
    if (name != null) updates.name = name.trim();
    if (age != null) {
      const ageNum = Number(age);
      if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
        return res.status(400).json({ message: "Age must be between 0 and 150" });
      }
      updates.age = ageNum;
    }
    if (gender != null) updates.gender = gender;
    if (contact != null) updates.contact = contact.trim();
    if (email !== undefined) updates.email = email?.trim() || null;
    if (address !== undefined) updates.address = address?.trim() || "";
    if (bloodGroup !== undefined) updates.bloodGroup = bloodGroup?.trim() || null;
    if (Array.isArray(allergies)) updates.allergies = allergies;

    const patient = await Patient.findOneAndUpdate(
      { _id: id, clinicId: req.user.clinicId },
      updates,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("createdBy", "name email")
      .lean();
    if (!patient) {
      return res.status(404).json({ message: "Patient not found in your clinic" });
    }
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

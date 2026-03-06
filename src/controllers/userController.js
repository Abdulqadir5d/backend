import User from "../models/User.js";
import Patient from "../models/Patient.js";
import mongoose from "mongoose";
import { createNotification } from "./notificationController.js";

const formatUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  subscriptionPlan: u.subscriptionPlan,
  isApproved: u.isApproved,
  specialization: u.specialization,
  licenseNumber: u.licenseNumber,
  createdAt: u.createdAt,
});

export const approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOneAndUpdate(
      { _id: id, clinicId: req.user.clinicId },
      { isApproved: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    await createNotification({
      userId: user._id,
      title: "Account Approved",
      message: "Your account has been approved by the administrator. You now have full access to clinical features.",
      type: "system",
      priority: "high",
      clinicId: req.user.clinicId,
    });

    res.json(formatUser(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOneAndUpdate(
      { _id: id, clinicId: req.user.clinicId },
      { isApproved: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    await createNotification({
      userId: user._id,
      title: "Account Suspended",
      message: "Your clinical access has been suspended. Please contact the administrator for details.",
      type: "system",
      priority: "high",
      clinicId: req.user.clinicId,
    });

    res.json(formatUser(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOneAndDelete({ _id: id, clinicId: req.user.clinicId });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const listUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 50 } = req.query;
    const filter = { clinicId: req.user.clinicId };
    if (role) filter.role = role;
    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password -refreshToken")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(filter),
    ]);
    res.json({
      users: users.map((u) => formatUser(u)),
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, specialization, licenseNumber } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password and role are required" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }
    const user = await User.create({
      name: name.trim(),
      email: email,
      password,
      role,
      specialization: specialization?.trim() || null,
      licenseNumber: licenseNumber?.trim() || null,
      clinicId: req.user.clinicId,
    });

    // If role is patient, automatically create and link a Patient record
    if (role === "patient") {
      const patient = await Patient.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        contact: "n/a",
        age: 0,
        gender: "other",
        clinicId: req.user.clinicId,
        createdBy: req.user.userId,
        userId: user._id,
      });
      user.patientId = patient._id;
      await user.save();
    }
    res.status(201).json(formatUser(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, subscriptionPlan, specialization, licenseNumber } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const updates = {};
    if (name != null) updates.name = name.trim();
    if (role != null) updates.role = role;
    if (subscriptionPlan != null) updates.subscriptionPlan = subscriptionPlan;
    if (specialization !== undefined) updates.specialization = specialization?.trim() || null;
    if (licenseNumber !== undefined) updates.licenseNumber = licenseNumber?.trim() || null;

    const user = await User.findOneAndUpdate(
      { _id: id, clinicId: req.user.clinicId },
      updates,
      {
        new: true,
        runValidators: true,
      }
    )
      .select("-password -refreshToken")
      .lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(formatUser(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

import User from "../models/User.js";
import Patient from "../models/Patient.js";
import jwt from "jsonwebtoken";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
import Clinic from "../models/Clinic.js";
import { createNotification } from "./notificationController.js";

const formatUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  subscriptionPlan: u.subscriptionPlan,
  patientId: u.patientId,
  specialization: u.specialization,
  clinicId: u.clinicId,
});

export const register = async (req, res) => {
  try {
    const { name, email, password, role, clinicId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const allowedRole = ["patient", "doctor", "receptionist", "nurse", "lab_technician", "pharmacist"].includes(role) ? role : "patient";

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    let finalClinicId = clinicId;
    if (!finalClinicId) {
      const mainClinic = await Clinic.findOne().sort({ createdAt: 1 });
      if (mainClinic) finalClinicId = mainClinic._id;
    }

    const user = await User.create({
      name: name.trim(),
      email,
      password,
      role: allowedRole,
      clinicId: finalClinicId,
      isApproved: allowedRole === "patient", // Only patients are auto-approved
    });

    // Notify admins if approval is required
    if (!user.isApproved) {
      const admins = await User.find({ role: "admin", clinicId: finalClinicId });
      for (const admin of admins) {
        await createNotification({
          userId: admin._id,
          title: "New Staff Registration",
          message: `${name} (${role}) is pending approval for active clinical duty.`,
          type: "system",
          priority: "medium",
          clinicId: finalClinicId,
        });
      }
    }

    // If registering as a patient and clinicId is provided, create the Patient record automatically
    if (allowedRole === "patient" && finalClinicId) {
      const patient = await Patient.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        contact: "n/a", // Placeholder, user can update later
        age: 0, // Placeholder
        gender: "other", // Placeholder
        clinicId: finalClinicId,
        createdBy: user._id,
        userId: user._id,
      });
      user.patientId = patient._id;
      await user.save();
    }

    const accessToken = generateAccessToken(user._id, user.role, user.clinicId);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      accessToken,
      refreshToken,
      user: formatUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isApproved) {
      return res.status(403).json({ message: "Your account is pending administrator approval." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user._id, user.role, user.clinicId);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      accessToken,
      refreshToken,
      user: formatUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findById(payload.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = generateAccessToken(user._id, user.role, user.clinicId);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password -refreshToken");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user: formatUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

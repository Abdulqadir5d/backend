import jwt from "jsonwebtoken";
import User from "../models/User.js";

const auth = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Contains userId, role, clinicId
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/** Require specific roles. Usage: requireRole('admin', 'doctor') */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
};

import Clinic from "../models/Clinic.js";

/** Require Pro subscription for AI features */
export const requireProPlan = async (req, res, next) => {
  try {
    if (!req.user.clinicId) {
      return res.status(403).json({ message: "No clinic associated" });
    }
    const clinic = await Clinic.findById(req.user.clinicId).select("plan");
    if (!clinic || (clinic.plan !== "pro" && clinic.plan !== "enterprise")) {
      return res.status(403).json({ message: "Pro/Enterprise plan required for this feature" });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export default auth;

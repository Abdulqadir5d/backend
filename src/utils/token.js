import jwt from "jsonwebtoken";

export const generateAccessToken = (userId, role, clinicId) => {
  return jwt.sign({ userId, role, clinicId }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

export const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

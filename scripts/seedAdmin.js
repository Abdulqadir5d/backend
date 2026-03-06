/**
 * Seed script to create initial admin user.
 * Run: node backend/scripts/seedAdmin.js
 */
import "dotenv/config";
import mongoose from "mongoose";
import User from "../src/models/User.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ai-clinic";

async function seed() {
  await mongoose.connect(MONGO_URI);
  const admin = await User.findOne({ role: "admin" });
  if (admin) {
    console.log("Admin already exists:", admin.email);
    process.exit(0);
  }
  const user = await User.create({
    name: "Admin",
    email: "admin@clinic.com",
    password: "admin123",
    role: "admin",
    subscriptionPlan: "pro",
    isApproved: true,
  });
  console.log("Admin created:", user.email);
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

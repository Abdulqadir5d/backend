import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export const ROLES = ["admin", "doctor", "receptionist", "patient"];
export const SUBSCRIPTION_PLANS = ["free", "pro"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ROLES,
      default: "patient",
      required: true,
    },
    subscriptionPlan: {
      type: String,
      enum: SUBSCRIPTION_PLANS,
      default: "free",
    },
    refreshToken: {
      type: String,
      default: null,
    },
    // Doctor-specific
    specialization: { type: String, default: null },
    licenseNumber: { type: String, default: null },
    // Patient link (for patient role - link user to patient record)
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", default: null },
    // Multi-tenancy
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: false, // Optional for system-wide users or during onboarding
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);

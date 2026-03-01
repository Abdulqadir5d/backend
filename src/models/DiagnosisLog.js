import mongoose from "mongoose";

const diagnosisLogSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    symptoms: {
      type: [String],
      default: [],
    },
    age: {
      type: Number,
      default: null,
    },
    gender: {
      type: String,
      default: null,
    },
    history: {
      type: String,
      default: "",
    },
    aiResponse: {
      possibleConditions: [{ type: String }],
      riskLevel: { type: String },
      suggestedTests: [{ type: String }],
      rawResponse: { type: String },
    },
    riskLevel: {
      type: String,
      default: null,
    },
    // Multi-tenancy
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

diagnosisLogSchema.index({ patientId: 1, createdAt: -1 });

export default mongoose.model("DiagnosisLog", diagnosisLogSchema);

import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    dosage: {
      type: String,
      required: true,
      trim: true,
    },
    frequency: {
      type: String,
      default: "",
    },
    duration: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
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
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
    diagnosis: {
      type: String,
      default: "",
    },
    medicines: [medicineSchema],
    instructions: {
      type: String,
      default: "",
    },
    aiExplanation: {
      type: String,
      default: null,
    },
    aiExplanationUrdu: {
      type: String,
      default: null,
    },
    pdfUrl: {
      type: String,
      default: null,
    },
    fulfillmentStatus: {
      type: String,
      enum: ["pending", "processed", "partially-filled", "out-of-stock", "cancelled"],
      default: "pending",
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

prescriptionSchema.index({ patientId: 1, createdAt: -1 });
prescriptionSchema.index({ doctorId: 1, createdAt: -1 });

export default mongoose.model("Prescription", prescriptionSchema);

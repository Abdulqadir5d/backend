import mongoose from "mongoose";

const labReportSchema = new mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Patient",
            required: true,
            index: true,
        },
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        testName: {
            type: String,
            required: true,
            trim: true,
        },
        description: { type: String },
        results: { type: String },
        status: {
            type: String,
            enum: ["ordered", "sample-collected", "processing", "completed", "cancelled"],
            default: "ordered",
        },
        fileUrl: { type: String },
        clinicId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Clinic",
            required: true,
            index: true,
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

export default mongoose.model("LabReport", labReportSchema);

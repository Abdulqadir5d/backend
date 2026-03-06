import mongoose from "mongoose";

const vitalsSchema = new mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Patient",
            required: true,
            index: true,
        },
        weight: { type: Number, help: "Weight in kg" },
        height: { type: Number, help: "Height in cm" },
        temperature: { type: Number, help: "Temperature in Celsius" },
        bloodPressure: {
            systolic: { type: Number },
            diastolic: { type: Number },
        },
        pulse: { type: Number },
        respiratoryRate: { type: Number },
        oxygenSaturation: { type: Number, help: "SpO2 percentage" },
        recordedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        clinicId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Clinic",
            required: true,
            index: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Vitals", vitalsSchema);

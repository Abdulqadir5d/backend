import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
    {
        clinicId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Clinic",
            required: true,
            index: true,
        },
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Patient",
            required: true,
        },
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Appointment",
        },
        items: [
            {
                description: { type: String, required: true },
                amount: { type: Number, required: true },
                quantity: { type: Number, default: 1 },
            },
        ],
        totalAmount: { type: Number, required: true },
        currency: { type: String, default: "PKR" },
        status: {
            type: String,
            enum: ["pending", "paid", "cancelled", "refunded"],
            default: "pending",
        },
        paymentMethod: {
            type: String,
            enum: ["cash", "card", "bank_transfer", "other"],
            default: "cash",
        },
        dueDate: Date,
        paidAt: Date,
        notes: String,
    },
    { timestamps: true }
);

export default mongoose.model("Invoice", invoiceSchema);

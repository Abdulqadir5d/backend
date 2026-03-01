import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
    {
        clinicId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Clinic",
            required: true,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        action: {
            type: String, // e.g., "VIEW_PATIENT", "EDIT_PRESCRIPTION", "DELETE_APPOINTMENT"
            required: true,
        },
        modelName: String,
        targetId: mongoose.Schema.Types.ObjectId,
        ipAddress: String,
        userAgent: String,
        details: mongoose.Schema.Types.Mixed,
    },
    { timestamps: true }
);

export default mongoose.model("AuditLog", auditLogSchema);

import mongoose from "mongoose";

const clinicSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Clinic name is required"],
            trim: true,
        },
        subdomain: {
            type: String,
            required: [true, "Subdomain is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        subscriptionStatus: {
            type: String,
            enum: ["active", "inactive", "trial", "past_due"],
            default: "trial",
        },
        plan: {
            type: String,
            enum: ["starter", "pro", "enterprise"],
            default: "starter",
        },
        aiCredits: {
            balance: { type: Number, default: 100 },
            lastReset: { type: Date, default: Date.now },
        },
        settings: {
            logoUrl: { type: String, default: null },
            address: { type: String, default: "" },
            contactNumber: { type: String, default: "" },
        },
    },
    { timestamps: true }
);

export default mongoose.model("Clinic", clinicSchema);

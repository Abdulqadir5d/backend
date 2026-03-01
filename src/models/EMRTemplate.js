import mongoose from "mongoose";

const fieldSchema = new mongoose.Schema({
    label: { type: String, required: true },
    type: {
        type: String,
        enum: ["text", "number", "date", "select", "multiline"],
        required: true
    },
    required: { type: Boolean, default: false },
    options: [String], // for select types
    placeholder: String,
});

const emrTemplateSchema = new mongoose.Schema(
    {
        clinicId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Clinic",
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: [true, "Template name is required"],
            trim: true,
        },
        description: String,
        fields: [fieldSchema],
        isActive: { type: Boolean, default: true },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

// Ensure unique template names per clinic
emrTemplateSchema.index({ clinicId: 1, name: 1 }, { unique: true });

export default mongoose.model("EMRTemplate", emrTemplateSchema);

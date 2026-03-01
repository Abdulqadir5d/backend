import EMRTemplate from "../models/EMRTemplate.js";

/** List all templates for the clinic */
export const listTemplates = async (req, res) => {
    try {
        const templates = await EMRTemplate.find({ clinicId: req.user.clinicId })
            .sort({ createdAt: -1 })
            .lean();
        res.json(templates);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/** Create a new EMR template */
export const createTemplate = async (req, res) => {
    try {
        const { name, description, fields } = req.body;
        if (!name || !fields?.length) {
            return res.status(400).json({ message: "Name and at least one field are required" });
        }

        const template = await EMRTemplate.create({
            clinicId: req.user.clinicId,
            name: name.trim(),
            description: description?.trim(),
            fields,
            createdBy: req.user.userId,
        });

        res.status(201).json(template);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: "A template with this name already exists in your clinic" });
        }
        res.status(500).json({ message: err.message });
    }
};

/** Delete a template */
export const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await EMRTemplate.findOneAndDelete({ _id: id, clinicId: req.user.clinicId });
        if (!result) {
            return res.status(404).json({ message: "Template not found" });
        }
        res.json({ message: "Template deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

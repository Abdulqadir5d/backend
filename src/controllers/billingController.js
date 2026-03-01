import Invoice from "../models/Invoice.js";
import Clinic from "../models/Clinic.js";
import Patient from "../models/Patient.js";

/** List all invoices for the clinic */
export const listInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find({ clinicId: req.user.clinicId })
            .populate("patientId", "name email")
            .sort({ createdAt: -1 })
            .lean();
        res.json(invoices);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/** Create a new invoice */
export const createInvoice = async (req, res) => {
    try {
        const { patientId, appointmentId, items, paymentMethod, notes, dueDate } = req.body;
        const clinicId = req.user.clinicId;

        if (!patientId || !items?.length) {
            return res.status(400).json({ message: "Patient ID and items are required" });
        }

        // Verify patient belongs to clinic
        const patient = await Patient.findOne({ _id: patientId, clinicId });
        if (!patient) return res.status(404).json({ message: "Patient not found" });

        const totalAmount = items.reduce((sum, item) => sum + (item.amount * (item.quantity || 1)), 0);

        const invoice = await Invoice.create({
            clinicId,
            patientId,
            appointmentId,
            items,
            totalAmount,
            paymentMethod,
            notes,
            dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
        });

        res.status(201).json(invoice);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/** Update invoice status (e.g., mark as paid) */
export const updateInvoiceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, paymentMethod } = req.body;

        const updates = { status };
        if (status === "paid") {
            updates.paidAt = new Date();
        }
        if (paymentMethod) updates.paymentMethod = paymentMethod;

        const invoice = await Invoice.findOneAndUpdate(
            { _id: id, clinicId: req.user.clinicId },
            updates,
            { new: true }
        );

        if (!invoice) return res.status(404).json({ message: "Invoice not found" });
        res.json(invoice);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/** Deduct AI Credits for a clinic (called internally by AI features) */
export const consumeAICredit = async (clinicId, cost = 1) => {
    try {
        const clinic = await Clinic.findById(clinicId);
        if (!clinic) return false;

        if (clinic.aiCredits.balance < cost) return false;

        clinic.aiCredits.balance -= cost;
        await clinic.save();
        return true;
    } catch (err) {
        console.error("Credit deduction failed:", err.message);
        return false;
    }
};

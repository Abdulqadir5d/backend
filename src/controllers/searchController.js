import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";

/** Global search across clinic data for the Command Palette */
export const globalSearch = async (req, res) => {
    try {
        const { query } = req.query;
        const clinicId = req.user.clinicId;

        if (!query || query.length < 2) {
            return res.json({ patients: [], appointments: [], prescriptions: [] });
        }

        const regex = new RegExp(query, "i");

        const [patients, appointments, prescriptions] = await Promise.all([
            // Search patients by name or email
            Patient.find({ clinicId, $or: [{ name: regex }, { email: regex }] })
                .limit(5)
                .select("name email")
                .lean(),

            // Search appointments (this is harder without joining, so we search patient name in appointment if it was stored, 
            // but usually we join. For now, let's search diagnosis or notes)
            Appointment.find({ clinicId, notes: regex })
                .populate("patientId", "name")
                .limit(5)
                .lean(),

            // Search prescriptions by diagnosis
            Prescription.find({ clinicId, diagnosis: regex })
                .populate("patientId", "name")
                .limit(5)
                .lean(),
        ]);

        res.json({
            patients: patients.map(p => ({ type: "patient", id: p._id, title: p.name, subtitle: p.email })),
            appointments: appointments.map(a => ({ type: "appointment", id: a._id, title: `Visit: ${a.patientId?.name}`, subtitle: a.notes })),
            prescriptions: prescriptions.map(pr => ({ type: "prescription", id: pr._id, title: pr.diagnosis, subtitle: `Patient: ${pr.patientId?.name}` })),
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

import User from "../models/User.js";

/** List doctors - accessible by admin, doctor, receptionist for dropdowns/scheduling */
export const listDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor", clinicId: req.user.clinicId })
      .select("_id name email specialization")
      .sort({ name: 1 })
      .lean();
    res.json({
      doctors: doctors.map((d) => ({ id: d._id, name: d.name, email: d.email, specialization: d.specialization })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

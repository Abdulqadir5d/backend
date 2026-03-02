
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/User.js";
import Patient from "./src/models/Patient.js";
import Clinic from "./src/models/Clinic.js";

dotenv.config();

async function probe() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const users = await User.find({}, "name email role clinicId").lean();
        console.log("\n--- USERS ---");
        users.forEach(u => console.log(`${u.name} (${u.role}) - Clinic: ${u.clinicId}`));

        const clinics = await Clinic.find({}, "name subdomain").lean();
        console.log("\n--- CLINICS ---");
        clinics.forEach(c => console.log(`${c.name} (${c.subdomain}) - ID: ${c._id}`));

        const patients = await Patient.find({}, "name clinicId").lean();
        console.log("\n--- PATIENTS ---");
        patients.forEach(p => console.log(`${p.name} - Clinic: ${p.clinicId}`));

        await mongoose.disconnect();
        console.log("\nDone");
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

probe();

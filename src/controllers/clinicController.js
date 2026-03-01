import Clinic from "../models/Clinic.js";
import User from "../models/User.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
import mongoose from "mongoose";

/** Register a new clinic and its first admin user */
export const registerClinic = async (req, res) => {
    try {
        const { clinicName, subdomain, adminName, adminEmail, password } = req.body;

        if (!clinicName || !subdomain || !adminName || !adminEmail || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // 1. Check if subdomain is taken
        const existingClinic = await Clinic.findOne({ subdomain });
        if (existingClinic) {
            return res.status(409).json({ message: "Subdomain already in use" });
        }

        // 2. Check if admin email is taken
        const existingUser = await User.findOne({ email: adminEmail });
        if (existingUser) {
            return res.status(409).json({ message: "Admin email already in use" });
        }

        // 3. Create the clinic placeholder (need ownerId later)
        const clinic = new Clinic({
            name: clinicName.trim(),
            subdomain: subdomain.toLowerCase().trim(),
            ownerId: new mongoose.Types.ObjectId(), // Temporary placeholder
            plan: "pro", // Default to pro for new clinics for trial
        });

        // 4. Create the admin user
        const adminUser = new User({
            name: adminName.trim(),
            email: adminEmail.toLowerCase().trim(),
            password,
            role: "admin",
            clinicId: clinic._id,
            subscriptionPlan: "pro", // Default to pro for new clinics for trial
        });

        // 5. Link clinic to owner
        clinic.ownerId = adminUser._id;

        // Save both (standalone mode - no transactions to support local MongoDB)
        await clinic.save();
        await adminUser.save();

        // Generate tokens
        const accessToken = generateAccessToken(adminUser._id, adminUser.role, clinic._id);
        const refreshToken = generateRefreshToken(adminUser._id);

        adminUser.refreshToken = refreshToken;
        await adminUser.save();

        res.status(201).json({
            message: "Clinic registered successfully",
            accessToken,
            refreshToken,
            clinic: {
                id: clinic._id,
                name: clinic.name,
                subdomain: clinic.subdomain,
            },
            user: {
                id: adminUser._id,
                name: adminUser.name,
                email: adminUser.email,
                role: adminUser.role,
                clinicId: clinic._id,
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/** Get current clinic settings */
export const getClinicSettings = async (req, res) => {
    try {
        const clinic = await Clinic.findById(req.user.clinicId);
        if (!clinic) return res.status(404).json({ message: "Clinic not found" });
        res.json(clinic);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/** Update clinic settings (Branding, Contact) */
export const updateClinicSettings = async (req, res) => {
    try {
        const { name, settings } = req.body;
        const clinicId = req.user.clinicId;

        const updates = {};
        if (name) updates.name = name.trim();
        if (settings) {
            updates.settings = {
                logoUrl: settings.logoUrl ?? undefined,
                address: settings.address ?? undefined,
                contactNumber: settings.contactNumber ?? undefined,
            };
        }

        const clinic = await Clinic.findByIdAndUpdate(clinicId, updates, { new: true });
        if (!clinic) return res.status(404).json({ message: "Clinic not found" });

        res.json(clinic);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/** Get clinic info by subdomain (Public for branding) */
export const getClinicBySubdomain = async (req, res) => {
    try {
        const { subdomain } = req.params;
        const clinic = await Clinic.findOne({ subdomain: subdomain.toLowerCase() })
            .select("name settings subdomain")
            .lean();

        if (!clinic) return res.status(404).json({ message: "Clinic not found" });
        res.json(clinic);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


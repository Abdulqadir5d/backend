/**
 * Migration script to ensure isApproved field exists on all users.
 * Run: node backend/scripts/migrate-approval.js
 */
import "dotenv/config";
import mongoose from "mongoose";
import User from "../src/models/User.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ai-clinic";

async function migrate() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB...");

    // Approved all existing admins
    const adminResult = await User.updateMany(
        { role: "admin", isApproved: { $exists: false } },
        { $set: { isApproved: true } }
    );
    console.log(`Updated ${adminResult.modifiedCount} unapproved admins to approved.`);

    // Set default (false) for other users who don't have the field, 
    // or true if you want to approve all existing users during migration
    const allResult = await User.updateMany(
        { isApproved: { $exists: false } },
        { $set: { isApproved: true } } // Set to true to avoid locking out existing users
    );
    console.log(`Updated ${allResult.modifiedCount} users with missing isApproved field (set to true).`);

    console.log("Migration complete.");
    process.exit(0);
}

migrate().catch((e) => {
    console.error(e);
    process.exit(1);
});

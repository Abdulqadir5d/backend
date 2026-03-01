import mongoose from "mongoose";
import "dotenv/config";
import User from "./src/models/User.js";

async function check() {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hackathon");
    const users = await User.find({}, "email role subscriptionPlan").lean();
    console.log("Users in DB:");
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});

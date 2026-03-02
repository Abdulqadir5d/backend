import request from "supertest";
import express from "express";
import authRoutes from "../src/routes/authRoutes.js";
import Clinic from "../src/models/Clinic.js";
import User from "../src/models/User.js";

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

describe("Auth Integration Tests", () => {
    let clinic;

    beforeEach(async () => {
        clinic = await Clinic.create({
            name: "Test Clinic",
            subdomain: "test-clinic",
        });
    });

    it("should register a new admin user and clinic", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send({
                name: "Admin User",
                email: "admin@test.com",
                password: "password123",
                clinicId: clinic._id,
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.user).toHaveProperty("email", "admin@test.com");
    });

    it("should fail to register with an invalid email", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send({
                name: "Admin User",
                email: "not-an-email",
                password: "password123",
                clinicId: clinic._id,
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toContain("email");
    });
});

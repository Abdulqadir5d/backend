import { z } from "zod";

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
    }),
});

export const registerSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Name is too short").max(50, "Name is too long"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        role: z.enum(["admin", "doctor", "receptionist", "patient"]).optional(),
        clinicId: z.string().optional(),
    }),
});

export const registerClinicSchema = z.object({
    body: z.object({
        clinicName: z.string().min(2, "Clinic name is too short"),
        subdomain: z.string().min(2, "Subdomain is too short").regex(/^[a-z0-h0-9-]+$/, "Subdomain can only contain lowercase letters, numbers, and hyphens"),
        adminName: z.string().min(2),
        adminEmail: z.string().email(),
        password: z.string().min(6),
    }),
});

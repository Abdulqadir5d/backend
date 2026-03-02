import { z } from "zod";

export const createPatientSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Name is required"),
        age: z.number().min(0).max(150),
        gender: z.enum(["male", "female", "other"]),
        contact: z.string().min(5, "Contact information is too short"),
        email: z.string().email().optional().nullable(),
        address: z.string().optional(),
        bloodGroup: z.string().optional().nullable(),
        allergies: z.array(z.string()).optional(),
    }),
});

export const updatePatientSchema = z.object({
    params: z.object({
        id: z.string(),
    }),
    body: z.object({
        name: z.string().min(2).optional(),
        age: z.number().min(0).max(150).optional(),
        gender: z.enum(["male", "female", "other"]).optional(),
        contact: z.string().min(5).optional(),
        email: z.string().email().optional().nullable(),
        address: z.string().optional(),
        bloodGroup: z.string().optional().nullable(),
        allergies: z.array(z.string()).optional(),
    }),
});

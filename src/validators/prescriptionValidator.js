import { z } from "zod";

export const createPrescriptionSchema = z.object({
    body: z.object({
        patientId: z.string().min(1, "Patient is required"),
        doctorId: z.string().optional(), // Auto-filled from req.user
        appointmentId: z.string().optional(),
        diagnosis: z.string().min(1, "Diagnosis is required"),
        medicines: z.array(z.object({
            name: z.string().min(1, "Medicine name is required"),
            dosage: z.string().min(1, "Dosage is required"),
            frequency: z.string().optional(),
            duration: z.string().optional(),
            notes: z.string().optional(),
        })).min(1, "At least one medicine is required"),
        instructions: z.string().optional(),
        clinicId: z.string().optional(), // Auto-filled from req.user
    }),
});

export const updatePrescriptionSchema = z.object({
    params: z.object({
        id: z.string(),
    }),
    body: z.object({
        diagnosis: z.string().optional(),
        medicines: z.array(z.object({
            name: z.string().min(1),
            dosage: z.string().min(1),
            frequency: z.string().optional(),
            duration: z.string().optional(),
            notes: z.string().optional(),
        })).optional(),
        instructions: z.string().optional(),
    }),
});

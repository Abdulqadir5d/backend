import { z } from "zod";

export const createAppointmentSchema = z.object({
    body: z.object({
        patientId: z.string().optional(), // Optional if user is a patient (backend auto-fills it)
        doctorId: z.string().min(1, "Doctor is required"),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
        timeSlot: z.string().min(1, "Time slot is required"),
        reason: z.string().optional(),
        notes: z.string().optional(),
    }),
});

export const updateAppointmentSchema = z.object({
    params: z.object({
        id: z.string(),
    }),
    body: z.object({
        status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        timeSlot: z.string().optional(),
        reason: z.string().optional(),
        notes: z.string().optional(),
    }),
});

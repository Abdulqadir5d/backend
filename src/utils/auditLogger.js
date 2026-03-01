import AuditLog from "../models/AuditLog.js";

/** Log sensitive actions (HIPAA compliant auditing) */
export const logAction = async (req, action, modelName = null, targetId = null, details = {}) => {
    try {
        if (!req.user || !req.user.clinicId) return;

        await AuditLog.create({
            clinicId: req.user.clinicId,
            userId: req.user.userId,
            action,
            modelName,
            targetId,
            ipAddress: req.ip,
            userAgent: req.get("User-Agent"),
            details,
        });
    } catch (err) {
        console.error(`[Audit] Failed to log action ${action}:`, err.message);
    }
};

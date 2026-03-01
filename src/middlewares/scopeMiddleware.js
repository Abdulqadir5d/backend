/**
 * Scope Middleware - Ensures every request is restricted to the user's clinic.
 * This is the core of multi-tenancy security.
 */

export const scopeMiddleware = (req, res, next) => {
    // 1. Skip scoping for system routes or unauthenticated requests if needed
    // (Assuming auth middleware has already run and populated req.user)

    if (!req.user || !req.user.clinicId) {
        // If user has no clinicId, they might be a new user in onboarding or a system admin
        return next();
    }

    // 2. Attach clinicId to the request for easy access in controllers
    req.clinicId = req.user.clinicId;

    // 3. (Optional) Inject clinicId into certain filters automatically
    // This is a more advanced technique (Query Hooking), but for now, 
    // we will manually use req.clinicId in our controllers for clarity.

    next();
};

/**
 * Ensures a request body or query param includes the current clinicId.
 * Useful for POST/PUT requests to prevent a user from injecting data into another clinic.
 */
export const enforceClinic = (req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        req.body.clinicId = req.user.clinicId;
    }
    next();
};

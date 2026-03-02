import { z } from "zod";

/**
 * Middleware to validate request data against a Zod schema
 * @param {z.ZodObject} schema - The Zod schema to validate against
 */
export const validate = (schema) => async (req, res, next) => {
    try {
        const data = await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        // Replace req data with validated/transformed data
        req.body = data.body;
        req.query = data.query;
        req.params = data.params;

        next();
    } catch (err) {
        if (err instanceof z.ZodError) {
            const errorMessage = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
            return res.status(400).json({ message: errorMessage });
        }
        next(err);
    }
};

import { Router } from "express";
import { register, login, refresh, logout, me } from "../controllers/authController.js";
import auth from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { loginSchema, registerSchema } from "../validators/authValidator.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", auth, logout);
router.get("/me", auth, me);

export default router;

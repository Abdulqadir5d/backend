import { Router } from "express";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/auth.js";
import { listUsers, createUser, updateUser } from "../controllers/userController.js";

const router = Router();

router.use(auth);
router.use(requireRole("admin"));

router.get("/", listUsers);
router.post("/", createUser);
router.patch("/:id", updateUser);

export default router;

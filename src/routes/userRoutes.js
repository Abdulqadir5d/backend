import { Router } from "express";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/auth.js";
import { listUsers, createUser, updateUser, approveUser, suspendUser, deleteUser } from "../controllers/userController.js";

const router = Router();

router.use(auth);
router.use(requireRole("admin"));

router.get("/", listUsers);
router.post("/", createUser);
router.patch("/:id", updateUser);
router.patch("/:id/approve", approveUser);
router.patch("/:id/suspend", suspendUser);
router.delete("/:id", deleteUser);

export default router;

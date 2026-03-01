import { Router } from "express";
import auth from "../middlewares/auth.js";
import { globalSearch } from "../controllers/searchController.js";

const router = Router();

router.use(auth);

router.get("/", globalSearch);

export default router;

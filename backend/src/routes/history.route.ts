import { Router } from "express";
import { getHistory } from "../controllers/history.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();
router.get("/:repoId", protect, getHistory);

export default router;

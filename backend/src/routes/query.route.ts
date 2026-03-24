import { Router } from "express";
import { ask } from "../controllers/query.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/ask", protect, ask);

export default router;
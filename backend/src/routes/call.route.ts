import { Router } from "express";
import { processCall, streamTTS } from "../controllers/call.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { llmRateLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = Router();

router.post("/process", protect, llmRateLimiter, processCall);
router.get("/tts", protect, llmRateLimiter, streamTTS);

export default router;

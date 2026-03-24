import { Router } from "express";
import { processCall, streamTTS } from "../controllers/call.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/process", protect, processCall);
router.get("/tts", protect, streamTTS);

export default router;

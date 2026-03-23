import { Router } from "express";
import { ask } from "../controllers/query.controller.js";

const router = Router();

router.post("/ask", ask);

export default router;
import type { Request, Response } from "express";
import ChatHistory from "../models/chatHistory.model.js";

export const getHistory = async (req: Request, res: Response): Promise<any> => {
  try {
    const { repoId } = req.params;
    const { type } = req.query;

    if (!repoId || !type || (type !== "chat" && type !== "call")) {
      return res.status(400).json({ success: false, message: "Invalid parameters" });
    }

    const userId = (req as any).user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const history = await ChatHistory.findOne({ userId, repoId, type });
    if (!history) {
      return res.json({ success: true, messages: [] });
    }

    return res.json({ success: true, messages: history.messages });
  } catch (error) {
    console.error("Fetch history failed:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

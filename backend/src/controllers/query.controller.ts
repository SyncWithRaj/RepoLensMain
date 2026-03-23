import type { Request, Response } from "express";
import { askQuestion } from "../services/query.service.js";

export const ask = async (req: Request, res: Response) => {

  try {

    const { repoId, question } = req.body;

    if (!repoId || !question) {
      return res.status(400).json({
        success: false,
        message: "repoId and question required"
      });
    }

    const result = await askQuestion(repoId, question);

    res.json({
      success: true,
      answer: result.answer,
      references: result.references
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Query failed"
    });

  }
};
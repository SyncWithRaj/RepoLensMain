import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

import { Repository } from "../models/repo.model.js";
import { scanCodeFiles } from "../modules/indexer/fileScanner.js";
import { processRepositoryParsing } from "../services/parser.service.js";

import { CodeEntity } from "../models/codeEntity.model.js";
import { CodeRelationship } from "../models/relationship.model.js";
import { FileMetadata } from "../models/fileMetadata.model.js";


export async function parseRepoController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid repository id"
      });
    }

    const repo = await Repository.findById(id);

    if (!repo) {
      return res.status(404).json({
        success: false,
        message: "Repository not found"
      });
    }

    if (!repo.localPath) {
      return res.status(400).json({
        success: false,
        message: "Repository localPath not found"
      });
    }


    repo.status = "indexing";
    await repo.save();


    await CodeEntity.deleteMany({ repoId: id });
    await CodeRelationship.deleteMany({ repoId: id });
    await FileMetadata.deleteMany({ repoId: id });


    const scannedFiles = scanCodeFiles(repo.localPath);

    if (!scannedFiles.length) {

      repo.status = "failed";
      await repo.save();

      return res.status(200).json({
        success: true,
        message: "No scannable files found"
      });
    }


    const filePaths = scannedFiles.map(file => file.absolutePath);

    const result = await processRepositoryParsing(id, filePaths);


    repo.status = "indexed";
    await repo.save();


    return res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {

    console.error("Parse Controller Error:", error);

    try {
      const { id } = req.params;
      await Repository.findByIdAndUpdate(id, { status: "failed" });
    } catch { }

    next(error);
  }
}
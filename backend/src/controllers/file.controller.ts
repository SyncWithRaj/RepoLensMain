import fs from "fs";
import path from "path";
import type { Request, Response } from "express";
import { Repository } from "../models/repo.model.js";

export const getFileTree = async (req: Request, res: Response) => {
  try {
    const { repoId } = req.params;

    const repo = await Repository.findById(repoId);

    if (!repo) {
      return res.status(404).json({ message: "Repository not found" });
    }

    const basePath = repo.localPath;

    function readDirRecursive(dir: string): any[] {
      const items = fs.readdirSync(dir);

      return items
        .filter(item => item !== ".git") // ignore .git
        .map((item) => {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          const relativePath = path.relative(basePath, fullPath);

          if (stat.isDirectory()) {
            return {
              name: item,
              path: relativePath,
              type: "folder",
              children: readDirRecursive(fullPath),
            };
          }

          return {
            name: item,
            path: relativePath,
            type: "file",
          };
        });
    }

    const tree = readDirRecursive(basePath);

    res.json({ files: tree });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "File tree error" });
  }
};

export const getFileContent = async (req: Request, res: Response) => {
  try {
    const { repoId, path: filePath } = req.query;

    const repo = await Repository.findById(repoId);

    if (!repo) {
      return res.status(404).json({ message: "Repository not found" });
    }

    const safePath = (filePath as string).replace(/^\/+/, "");

    const fullPath = path.join(repo.localPath, safePath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: "File not found" });
    }

    const content = fs.readFileSync(fullPath, "utf-8");

    res.json({ content });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "File content error" });
  }
};
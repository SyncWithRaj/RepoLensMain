import type { Request, Response } from "express";
import simpleGit from "simple-git";
import fs from "fs"
import path from "path";
import { scanCodeFiles } from "../modules/indexer/fileScanner.js";
import { Repository } from "../models/repo.model.js";
import { CodeEntity } from "../models/codeEntity.model.js";
import { CodeRelationship } from "../models/relationship.model.js";
import { FileMetadata } from "../models/fileMetadata.model.js";
import { FileContent } from "../models/fileContent.model.js";
import { QdrantClient } from "@qdrant/js-client-rest";
import { getTempRepoPath } from "../utils/cleanup.util.js";

// Prevent Git from trying to prompt for credentials in server environments (Render, Docker, etc.)
// Without this, Git tries to open /dev/tty which doesn't exist in containers
process.env.GIT_TERMINAL_PROMPT = '0';
process.env.GIT_ASKPASS = 'echo';

const git = simpleGit();

export const addRepository = async (req: Request, res: Response) => {
    try {
        const { githubUrl } = req.body;
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({ message: "Not authorized" });
        }

        if (!githubUrl) {
            return res.status(400).json({ message: "GitHub URL is required" });
        }

        if (!githubUrl.startsWith("https://github.com/")) {
            return res.status(400).json({
                message: "Invalid GitHub repository URL",
            });
        }

        const repoName = githubUrl.split("/").pop()?.replace(".git", "");

        if (!repoName) {
            return res.status(400).json({ message: "Invalid GitHub URL" });
        }

        const repo = new Repository({
            user: user._id,
            name: repoName,
            githubUrl,
            status: "cloning",
        });

        const repoPath = getTempRepoPath(user._id.toString(), repo._id.toString());

        fs.mkdirSync(repoPath, { recursive: true });

        repo.localPath = repoPath;
        await repo.save();

        try {
            console.log("🚀 Cloning repo...");

            // Clone with -c flags to prevent credential prompts on Render/Docker
            await git.clone(githubUrl, repoPath, [
                "--depth", "1",
                "-c", "core.askPass=",
                "-c", "credential.helper=",
            ]);

            console.log("✅ CLONE DONE");

            const files = fs.readdirSync(repoPath);
            console.log("FILES AFTER CLONE:", files);

            if (files.length === 0) {
                throw new Error("Clone failed: empty directory");
            }

            const gitRepo = simpleGit(repoPath);
            const latestCommit = await gitRepo.revparse(["HEAD"]);

            console.log("COMMIT:", latestCommit);

            repo.commitHash = latestCommit;
            repo.fingerprint = `${repo.githubUrl}_${latestCommit}`;
            repo.status = "cloned";

            await repo.save();

            console.log("✅ REPO SAVED WITH CLONED STATUS");

        } catch (cloneError) {
            console.error("❌ CLONE ERROR:", cloneError);

            repo.status = "failed";
            await repo.save();

            if (fs.existsSync(repoPath)) {
                fs.rmSync(repoPath, { recursive: true, force: true });
            }

            return res.status(500).json({
                success: false,
                message: "Repository cloning failed",
            });
        }

        return res.status(201).json({
            success: true,
            repo,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Repository cloning failed"
        });
    }
};

export const getUserRepositories = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({ message: "Not authorized" });
        }

        const repos = await Repository.find({ user: user._id }).select("-__v");

        res.json({
            success: true,
            repos,
        });
    } catch (error) {
        res.status(500).json({ message: "Failes to fetch repositories" })
    }
};

export const getRepositoryById = async (req: Request, res: Response) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: "Not authorized" });
        }


        const repo = await Repository.findOne({
            _id: req.params.id,
            user: user._id,
        }).select("-__v");

        if (!repo) {
            return res.status(404).json({ message: "Repo not found" });
        }

        res.json({
            success: true,
            repo,
        })
    } catch (error) {
        res.status(500).json({ message: "Failes to fetch repositories" })
    }
}

export const deleteRepository = async (req: Request, res: Response) => {
    try {

        const repoId = req.params.id;

        const repo = await Repository.findById(repoId);

        if (!repo) {
            return res.status(404).json({
                success: false,
                message: "Repo not found"
            });
        }

        // Temp clone is already deleted after parsing.
        // Only attempt disk cleanup if localPath still exists (edge case)
        if (repo.localPath && fs.existsSync(repo.localPath)) {
            fs.rmSync(repo.localPath, { recursive: true, force: true });
        }

        const qdrant = new QdrantClient({
            url: process.env.QDRANT_URL || "http://localhost:6333",
            apiKey: process.env.QDRANT_API_KEY!,
        });

        const COLLECTION = "repo_entities";

        // 🔍 check how many repos share fingerprint
        const count = await Repository.countDocuments({
            fingerprint: repo.fingerprint,
        });

        if (count === 1) {
            try {
                console.log("Attempting vector deletion for:", repo.fingerprint);

                await qdrant.delete(COLLECTION, {
                    filter: {
                        must: [
                            {
                                key: "metadata.fingerprint",
                                match: {
                                    value: repo.fingerprint,
                                },
                            },
                        ],
                    },
                });

                console.log("✅ Vectors deleted (if existed)");
            } catch (err: any) {
                if (err?.status === 404) {
                    console.log("⚠️ Collection not found → skip delete (safe)");
                } else {
                    console.error("❌ Qdrant delete error:", err);
                }
            }
        } else {
            console.log("Skipping vector deletion (shared by multiple users)");
        }

        await CodeEntity.deleteMany({ repoId: repoId });
        await CodeRelationship.deleteMany({ repoId: repoId });
        await FileMetadata.deleteMany({ repoId: repoId });
        await FileContent.deleteMany({ repoId: repoId });

        await repo.deleteOne();

        res.json({
            success: true,
            message: "Repository and all related data deleted"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to delete repository"
        });

    }
};

export const scanRepository = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        const repo = await Repository.findOne({
            _id: req.params.id,
            user: user._id,
        })

        if (!repo) {
            return res.status(404).json({ message: "Repository not found" });
        }

        // Read from FileMetadata in DB instead of disk
        const files = await FileMetadata.find({ repoId: repo._id }).select("-__v").lean();

        return res.json({
            success: true,
            totalFiles: files.length,
            files
        })
    } catch (error) {
        return res.status(500).json({ message: "Scan Failed" })
    }
}
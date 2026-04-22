import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import simpleGit from "simple-git";
import fs from "fs";
import { Repository } from "../models/repo.model.js";
import type { JobData, JobResult } from "../queue/jobQueue.js";
import { getTempRepoPath } from "../utils/cleanup.util.js";
import { scanCodeFiles } from "../modules/indexer/fileScanner.js";
import { processRepositoryParsing } from "../services/parser.service.js";
import { embedRepository } from "../services/embedRepository.service.js";

const redisConnection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: null,
});

// Prevent Git from trying to prompt for credentials
process.env.GIT_TERMINAL_PROMPT = '0';
delete process.env.GIT_ASKPASS;

export const repoWorker = new Worker<JobData, JobResult, string>(
    "repo-processing-queue",
    async (job: Job<JobData>) => {
        const { repoUrl, userId, repoId } = job.data;
        const repoPath = getTempRepoPath(userId, repoId);

        try {
            console.log(`[Worker] Started processing job ${job.id} for repo ${repoUrl}`);

            // === STEP 1: Git Clone ===
            await job.updateProgress(10);
            
            // Clean up potentially malformed SSH URLs to enforce https format
            let safeUrl = repoUrl;
            if (safeUrl.startsWith('git@github.com:')) {
                safeUrl = safeUrl.replace('git@github.com:', 'https://github.com/');
            }
            if (safeUrl.endsWith('.git')) {
                safeUrl = safeUrl.replace('.git', '');
            }

            // Create temp directory explicitly
            if (!fs.existsSync(repoPath)) {
                fs.mkdirSync(repoPath, { recursive: true });
            }

            console.log(`[Worker] Cloning ${safeUrl} into ${repoPath}`);
            const git = simpleGit();
            await git.clone(safeUrl, repoPath, [
                "--depth", "1",
                "-c", "credential.helper=",
            ]);

            const clonedRepo = simpleGit(repoPath);
            const latestCommit = await clonedRepo.revparse(["HEAD"]);

            await Repository.findByIdAndUpdate(repoId, {
                commitHash: latestCommit,
                fingerprint: `${safeUrl}_${latestCommit}`,
                status: "indexing"
            });

            await job.updateProgress(30);

            // === STEP 2: AST Parsing ===
            console.log(`[Worker] Generating AST for ${repoId}`);
            
            // Clean up old data to prevent duplicates on re-analysis
            const { CodeEntity } = await import("../models/codeEntity.model.js");
            const { CodeRelationship } = await import("../models/relationship.model.js");
            const { FileMetadata } = await import("../models/fileMetadata.model.js");
            const { FileContent } = await import("../models/fileContent.model.js");
            
            await CodeEntity.deleteMany({ repoId });
            await CodeRelationship.deleteMany({ repoId });
            await FileMetadata.deleteMany({ repoId });
            await FileContent.deleteMany({ repoId });
            
            // scanCodeFiles automatically ignores node_modules, .git, etc.
            const scannedFiles = scanCodeFiles(repoPath);
            if (scannedFiles.length === 0) {
                throw new Error("No valid code files found to parse.");
            }

            const filePaths = scannedFiles.map(f => f.absolutePath);
            await processRepositoryParsing(repoId, filePaths);

            // Save file tree and contents to MongoDB so FileExplorer works
            console.log(`[Worker] Saving file tree and contents to MongoDB for ${repoId}`);
            const { saveRepoFilesToDB } = await import("../services/parser.service.js");
            const savedFilesCount = await saveRepoFilesToDB(repoId, repoPath);
            console.log(`[Worker] Saved ${savedFilesCount} files/dirs to MongoDB`);

            await job.updateProgress(60);

            // === STEP 3: Vector Embedding ===
            console.log(`[Worker] Uploading semantics to Qdrant for ${repoId}`);
            await job.updateProgress(80);
            await embedRepository(repoId);

            // === SUCCESS ===
            await Repository.findByIdAndUpdate(repoId, { status: "indexed" });
            await job.updateProgress(100);

            console.log(`[Worker] Job ${job.id} completed successfully.`);
            return { success: true, repoId, message: "Repository processed successfully." };

        } catch (error: any) {
            console.error(`[Worker] Job ${job.id} failed:`, error);
            
            await Repository.findByIdAndUpdate(repoId, { status: "failed" });

            throw new Error(error.message || "Repository processing failed.");
        } finally {
            // === STEP 4: Bulletproof Cleanup ===
            try {
                if (fs.existsSync(repoPath)) {
                    await fs.promises.rm(repoPath, { recursive: true, force: true });
                    console.log(`[Worker] Successfully cleaned up temporary directory: ${repoPath}`);
                }
            } catch (cleanupError) {
                console.error(`[Worker] FATAL: Failed to clean up ${repoPath}:`, cleanupError);
            }
        }
    },
    {
        connection: redisConnection,
        concurrency: 5, // Allow processing up to 5 repos concurrently
    }
);

repoWorker.on("completed", (job) => {
    console.log(`[Worker-Event] Job ${job.id} has completed!`);
});

repoWorker.on("failed", (job, err) => {
    console.log(`[Worker-Event] Job ${job?.id} has failed with ${err.message}`);
});

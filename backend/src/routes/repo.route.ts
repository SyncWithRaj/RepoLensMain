import { Router } from "express";
import { addRepository, deleteRepository, getRepositoryById, getUserRepositories, scanRepository } from "../controllers/repo.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { parseRepoController } from "../controllers/parser.controller.js";
import { getRepositoryEntities } from "../controllers/codeEntity.controller.js";
import { getRepositoryoRelations}from "../controllers/relationship.controller.js"
import { getRepoFilesController } from "../controllers/fileMetadata.controller.js";

const router = Router();

router.post("/", protect, addRepository)
router.get("/", protect, getUserRepositories)
router.get("/:id", protect, getRepositoryById)
router.delete("/:id", protect, deleteRepository)
router.get("/:id/scan", protect, scanRepository);
router.post("/:id/parse", protect, parseRepoController);
router.get("/:id/entities", protect, getRepositoryEntities);
router.get("/:id/relations", protect, getRepositoryoRelations)
router.get("/:id/files", getRepoFilesController);

export default router;
import type { Request, Response } from "express";
import { FileMetadata } from "../models/fileMetadata.model.js";
import { CodeRelationship } from "../models/relationship.model.js";
import { Repository } from "../models/repo.model.js";
import path from "path";

export const getRepositoryGraph = async (req: Request, res: Response): Promise<any> => {
    try {
        const repoId = req.params.id;

        if (!repoId) {
            return res.status(400).json({ success: false, message: "Repository ID is required" });
        }

        const repo = await Repository.findById(repoId);
        if (!repo) {
            return res.status(404).json({ success: false, message: "Repository not found" });
        }

        // Fetch all files metadata for this repo
        const files = await FileMetadata.find({ repoId }).lean();
        
        // Fetch all relationships for this repo
        const relationships = await CodeRelationship.find({ repoId }).lean();

        const nodes: any[] = [];
        const edges: any[] = [];
        const folderNodesMap = new Map();

        // 1. Process files and build folder hierarchy
        for (const file of files) {
            // File Node
            nodes.push({
                id: file.filePath,
                path: path.relative(repo.localPath, file.filePath),
                name: file.fileName,
                type: "file",
                val: Math.max(5, Math.min(20, Math.sqrt(file.fileSize || 100))), // Dynamic scale
                group: file.filePath.split('/')[0] || "root",
                metadata: {
                    fileSize: file.fileSize,
                    totalLines: file.totalLines,
                    hasReactComponent: file.hasReactComponent,
                    isBackendFile: file.isBackendFile,
                    isTestFile: file.isTestFile
                }
            });

            // Path parsing for Folders using RELATIVE path to avoid absolute root chain
            const relativeFilePath = path.relative(repo.localPath, file.filePath).replace(/\\/g, '/');
            const parts = relativeFilePath.split('/');
            let currentPath = "";
            
            // Loop through directories (excluding the file itself)
            for (let i = 0; i < parts.length - 1; i++) {
                const parentPath = currentPath;
                const part = parts[i] as string;
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                
                if (!folderNodesMap.has(currentPath)) {
                    folderNodesMap.set(currentPath, {
                        id: currentPath, // use relative path as ID for folders
                        path: currentPath,
                        name: part,
                        type: "folder",
                        val: 15, // Folder base size
                        metadata: { isFolder: true, descendentCount: 1 }
                    });
                    
                    // Folder -> Folder edge
                    if (parentPath) {
                        edges.push({
                            source: parentPath,
                            target: currentPath,
                            label: "contains",
                            line: 0
                        });
                    }
                } else {
                    folderNodesMap.get(currentPath).metadata.descendentCount++;
                }
            }

            // Folder -> File edge (connect relative folder to absolute file ID)
            if (currentPath) {
                edges.push({
                    source: currentPath,
                    target: file.filePath,
                    label: "contains",
                    line: 0
                });
            }
        }

        // Add all distinct folder nodes to the main nodes array
        for (const folderNode of folderNodesMap.values()) {
            nodes.push(folderNode);
        }

        const nodeIds = new Set(nodes.map(n => n.id));

        // 2. Add structural Code Dependencies (imports, calls, etc.)
        for (const rel of relationships) {
            if (rel.fromFilePath && rel.toFilePath) {
                if (nodeIds.has(rel.fromFilePath) && nodeIds.has(rel.toFilePath)) {
                    edges.push({
                        source: rel.fromFilePath as string,
                        target: rel.toFilePath as string,
                        label: rel.relationType, // "imports", "calls", "handles", etc.
                        line: rel.line
                    });
                }
            }
        }

        return res.status(200).json({
            success: true,
            graph: {
                nodes,
                edges
            }
        });

    } catch (error) {
        console.error("Error fetching repository graph:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch repository graph" });
    }
};

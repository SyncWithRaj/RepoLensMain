import { CodeEntity } from "../models/codeEntity.model.js";
import { Repository } from "../models/repo.model.js";
import { generateAnswer } from "./llm.service.js";
import { searchVectors } from "./vector.service.js";
import path from "path";

export const askQuestion = async (repoId: string, question: string) => {
    const repo = await Repository.findById(repoId);
    if (!repo) throw new Error("Repository not found");

    const results = await searchVectors(repoId, question);

    console.log("VECTOR RESULTS:", results);

    const entityIds = results.map((r: any) => r[0].metadata.mongoId);

    const entities = await CodeEntity.find({
        _id: { $in: entityIds }
    });

    const entityMap = new Map(
        entities.map((e: any) => [e._id.toString(), e])
    );

    const context = entityIds.map((id: string, index: number) => {

        const entity = entityMap.get(id);
        if (!entity) return null;
        
        const relativePath = path.relative(repo.localPath, entity.filePath).replace(/\\/g, '/');

        return {
            filePath: relativePath,
            code: entity.content,
            startLine: entity.startLine,
            endLine: entity.endLine,
            score: results[index][1]
        };

    }).filter((c: any) => c !== null);

    const prompt = `
You are RepoLens, an AI assistant that helps developers understand a codebase.

Your job is to analyze code snippets from a repository and explain them clearly.

User Question:
${question}

Relevant Code Context:
${context.map(c => `
File: ${c.filePath}
Lines: ${c.startLine}-${c.endLine}

${c.code}
`).join("\n")}

Instructions:
- Answer the user's question using ONLY the provided code context.
- Explain what the code does.
- Mention which file the code belongs to.
- Mention the line numbers when relevant.
- If the code relates to another component (route, controller, service, etc.), explain that relationship.
- If the answer cannot be found in the provided code, say: "The answer was not found in the indexed codebase."

Response format:
1. Short direct answer
2. Explanation of what the code does
3. File location and line numbers
`;

    const answer = await generateAnswer(prompt);

    const references = context
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(c => ({
            file: c.filePath,
            startLine: c.startLine,
            endLine: c.endLine
        }));

    return {
        answer,
        references
    };
};
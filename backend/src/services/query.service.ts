import { CodeEntity } from "../models/codeEntity.model.js";
import { Repository } from "../models/repo.model.js";
import { generateAnswer } from "./llm.service.js";
import { searchVectors } from "./vector.service.js";
import path from "path";

export const askQuestion = async (repoId: string, question: string, history: any[] = []) => {
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

    const formattedHistory = history.slice(-6).map(msg => `${msg.role === 'user' ? 'User' : 'RepoLens'}: ${msg.content}`).join('\n\n');

    const prompt = `
You are RepoLens, a friendly and helpful AI assistant that helps developers understand a codebase.

Your job is to analyze code snippets from a repository and answer questions clearly without any customized text like bold italic underline etc just normal text.

${formattedHistory ? `Previous Conversation History:\n${formattedHistory}\n\n` : ''}User Question:
${question}

Relevant Code Context:
${context.map(c => `
File: ${c.filePath}
Lines: ${c.startLine}-${c.endLine}

${c.code}
`).join("\n")}

Instructions:
- Answer the user's question using ONLY the provided code context.
- **CRITICAL**: If the user's question is out of context or unrelated to the provided codebase, DO NOT explain the provided code context. Instead, reply politely and with good vibes that you can only answer questions related to the indexed repository and couldn't find the answer to their question.
- If the question IS related to the codebase context:
  - Provide a short direct answer.
  - Explain what the relevant code does.
  - Mention which file the code belongs to.
  - Mention the line numbers when relevant.
  - If the code relates to another component, explain that relationship.
  - Please use the exact response format below.

Response format (ONLY if the question is related to the context):
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
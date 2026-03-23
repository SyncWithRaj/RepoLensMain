import { CodeEntity } from "../models/codeEntity.model.js";
import { generateAnswer } from "./llm.service.js";
import { searchVectors } from "./vector.service.js";

export const askQuestion = async (repoId: string, question: string) => {

    const results = await searchVectors(repoId, question, 3);

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

        return {
            filePath: entity.filePath,
            code: entity.content,
            startLine: entity.startLine,
            endLine: entity.endLine,
            score: results[index][1]
        };

    });

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

    const sources = context
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(c => ({
            filePath: c.filePath,
            startLine: c.startLine,
            endLine: c.endLine
        }));

    return {
        answer,
        sources
    };
};
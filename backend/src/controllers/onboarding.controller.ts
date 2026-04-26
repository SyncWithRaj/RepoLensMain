import type { Request, Response } from "express";
import { Repository } from "../models/repo.model.js";
import { FileMetadata } from "../models/fileMetadata.model.js";
import { CodeEntity } from "../models/codeEntity.model.js";
import { generateAnswer } from "../services/llm.service.js";

export const generateOnboardingGuide = async (req: Request, res: Response): Promise<any> => {
    try {
        const repoId = req.params.id;

        if (!repoId) {
            return res.status(400).json({ success: false, message: "Repository ID is required" });
        }

        const repo = await Repository.findById(repoId);
        if (!repo) {
            return res.status(404).json({ success: false, message: "Repository not found" });
        }

        // Return the cached guide if it already exists
        if (repo.onboardingGuide) {
            return res.status(200).json({
                success: true,
                guide: repo.onboardingGuide
            });
        }

        // Fetch limited data to avoid exceeding context limits and save tokens
        const files = await FileMetadata.find({ repoId }).limit(150).lean();
        const entities = await CodeEntity.find({ repoId }).limit(200).lean();

        let prompt = `Analyze the repository '${repo.name}' and create an onboarding guide for a new developer joining the team.\n\n`;
        
        prompt += `### Files Context:\n`;
        files.forEach(f => {
            prompt += `- ${f.filePath} (React Component: ${f.hasReactComponent}, Backend: ${f.isBackendFile})\n`;
        });
        
        prompt += `\n### Entities Context:\n`;
        entities.forEach(e => {
            prompt += `- ${e.name} (${e.type}) in ${e.filePath}\n`;
        });

        prompt += `
Based on this structural data, generate a comprehensive onboarding guide in strictly valid JSON format. Do not use Markdown backticks. Do not include any explanations outside the JSON block.

The JSON MUST follow this exact schema:
{
  "entryPoints": [
    { "file": "string", "description": "string" }
  ],
  "mainSchemas": [
    { "name": "string", "file": "string", "description": "string" }
  ],
  "coreUIComponents": [
    { "name": "string", "file": "string", "description": "string" }
  ],
  "readingList": [
    { "order": number, "file": "string", "reason": "string" }
  ]
}

- entryPoints: Identify the main entry files for backend/frontend (e.g., server.ts, app.ts, main.tsx, index.js).
- mainSchemas: Identify database models, schemas, or core types.
- coreUIComponents: Identify critical frontend components (e.g., layouts, major pages).
- readingList: Provide a step-by-step reading list of 5-10 files a new developer should read in order to understand the repository, with a reason for each.`;

        let resultText = await generateAnswer(prompt);

        // Try to parse the JSON. The LLM might wrap it in markdown block.
        try {
            // Strip markdown formatting if present
            if (resultText.startsWith("\`\`\`json")) {
                resultText = resultText.replace(/\`\`\`json\n/g, "").replace(/\n\`\`\`/g, "");
            } else if (resultText.startsWith("\`\`\`")) {
                resultText = resultText.replace(/\`\`\`\n/g, "").replace(/\n\`\`\`/g, "");
            }
            
            const parsedGuide = JSON.parse(resultText);

            // Save the guide to the database
            repo.onboardingGuide = parsedGuide;
            await repo.save();

            return res.status(200).json({
                success: true,
                guide: parsedGuide
            });
        } catch (parseError) {
            console.error("Failed to parse Gemini response as JSON:", resultText);
            return res.status(500).json({ success: false, message: "AI response was not valid JSON", raw: resultText });
        }

    } catch (error) {
        console.error("Error generating onboarding guide:", error);
        return res.status(500).json({ success: false, message: "Failed to generate onboarding guide" });
    }
};

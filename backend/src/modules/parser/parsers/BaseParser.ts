import fs from "fs";

export type EntityType = "function" | "class" | "method" | "constructor" | "property" | "staticMethod" | "arrow" | "interface" | "typeAlias" | "enum" | "variable" | "import" | "export" | "route" | "css" | "html";
export type RelationType = "calls" | "accesses" | "imports";

export type ParsedEntity = {
    repoId: string;
    filePath: string;
    name: string;
    type: EntityType;
    parameters: string[];
    returnType: string;
    startLine: number;
    endLine: number;
    content: string;
    scopeDepth: number;
    parentName?: string | null;
}

export type ParsedRelationship = {
    repoId: string;
    fromName: string;
    fromFilePath: string;
    toName: string;
    toFilePath?: string | null;
    relationType: RelationType;
    line: number;
}

export type ParsedFileMetadata = {
    repoId: string;
    filePath: string;
    fileName: string;
    fileSize: number;
    totalLines: number;
    hasDefaultExport: boolean;
    hasReactComponent: boolean;
    isBackendFile: boolean;
    isTestFile: boolean;
}

export interface LanguageParser {
    parse(repoId: string, filePath: string, content: string): Promise<{
        entities: ParsedEntity[];
        relationships: ParsedRelationship[];
        fileMetadata: ParsedFileMetadata;
    }>;
}

export abstract class BaseParser implements LanguageParser {
    protected extractFileMetadata(repoId: string, filePath: string, content: string): ParsedFileMetadata {
        const fileName = filePath.split("/").pop() || "";
        let fileSize = 0;
        try {
            const stats = fs.statSync(filePath);
            fileSize = stats.size;
        } catch (e) {
            fileSize = Buffer.byteLength(content, 'utf8');
        }
        
        const totalLines = content.split("\n").length;
        
        const hasReactComponent = content.includes("React") || content.includes("useState") || content.includes("useEffect");
        const isBackendFile = filePath.includes("controller") || filePath.includes("service") || filePath.includes("route") || filePath.includes("model");
        const isTestFile = filePath.includes(".test.") || filePath.includes(".spec.") || filePath.includes("__tests__");
        
        return {
            repoId,
            filePath,
            fileName,
            fileSize,
            totalLines,
            hasDefaultExport: content.includes("export default"),
            hasReactComponent,
            isBackendFile,
            isTestFile
        };
    }

    abstract parse(repoId: string, filePath: string, content: string): Promise<{
        entities: ParsedEntity[];
        relationships: ParsedRelationship[];
        fileMetadata: ParsedFileMetadata;
    }>;
}

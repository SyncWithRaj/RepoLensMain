import Parser from "tree-sitter";
import Go from "tree-sitter-go";
import { BaseParser, type ParsedEntity, type ParsedRelationship, type ParsedFileMetadata } from "./BaseParser";

export class GoParser extends BaseParser {
    private parser: Parser;

    constructor() {
        super();
        this.parser = new Parser();
        this.parser.setLanguage(Go);
    }

    async parse(repoId: string, filePath: string, content: string): Promise<{ entities: ParsedEntity[]; relationships: ParsedRelationship[]; fileMetadata: ParsedFileMetadata; }> {
        const fileMetadata = this.extractFileMetadata(repoId, filePath, content);
        const tree = this.parser.parse(content);
        
        const entities: ParsedEntity[] = [];
        const relationships: ParsedRelationship[] = [];
        const seen = new Set<string>();

        const walk = (node: Parser.SyntaxNode, depth: number, parentName: string | null) => {
            const key = `${filePath}:${node.startPosition.row}:${node.type}`;
            if (seen.has(key)) return;
            seen.add(key);

            let type: string | null = null;
            let name = "anonymous";
            let parameters: string[] = [];

            if (node.type === 'function_declaration' || node.type === 'method_declaration') {
                type = node.type === 'method_declaration' ? "method" : "function";
                name = node.childForFieldName('name')?.text || name;
            } else if (node.type === 'type_declaration') {
                type = "class"; 
                for (let i = 0; i < node.childCount; i++) {
                    const child = node.child(i)!;
                    if (child.type === 'type_spec') {
                        name = child.childForFieldName('name')?.text || name;
                    }
                }
            } else if (node.type === 'import_spec') {
                type = "import";
                name = "import";
            }

            if (type) {
                entities.push({
                    repoId,
                    filePath,
                    name,
                    type: type as any,
                    parameters,
                    returnType: "any",
                    startLine: node.startPosition.row + 1,
                    endLine: node.endPosition.row + 1,
                    content: node.text,
                    scopeDepth: depth,
                    parentName
                });
            }

            if (node.type === 'call_expression') {
                const func = node.childForFieldName('function');
                if (func) {
                    relationships.push({
                        repoId,
                        fromName: parentName || "anonymous",
                        fromFilePath: filePath,
                        toName: func.text,
                        relationType: "calls",
                        line: node.startPosition.row + 1
                    });
                }
            }

            if (node.type === 'import_spec') {
                const pathNode = node.childForFieldName('path');
                if (pathNode) {
                    relationships.push({
                        repoId,
                        fromName: filePath.split('/').pop() || filePath,
                        fromFilePath: filePath,
                        toName: pathNode.text.replace(/['"`]/g, ""),
                        relationType: "imports",
                        line: node.startPosition.row + 1
                    });
                }
            }

            for (let i = 0; i < node.childCount; i++) {
                walk(node.child(i)!, depth + (this.isScopeNode(node) ? 1 : 0), this.getScopeName(node) || parentName);
            }
        };

        if (tree.rootNode) walk(tree.rootNode, 0, null);

        return { entities, relationships, fileMetadata };
    }

    private isScopeNode(node: Parser.SyntaxNode) {
        return ['function_declaration', 'method_declaration'].includes(node.type);
    }
    
    private getScopeName(node: Parser.SyntaxNode) {
        if (node.type === 'function_declaration' || node.type === 'method_declaration') {
            return node.childForFieldName('name')?.text || null;
        }
        return null;
    }
}

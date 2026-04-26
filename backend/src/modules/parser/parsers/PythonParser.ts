import Parser from "tree-sitter";
import Python from "tree-sitter-python";
import { BaseParser, type ParsedEntity, type ParsedRelationship, type ParsedFileMetadata } from "./BaseParser";

export class PythonParser extends BaseParser {
    private parser: Parser;

    constructor() {
        super();
        this.parser = new Parser();
        this.parser.setLanguage(Python);
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

            if (node.type === 'function_definition') {
                type = "function";
                name = node.childForFieldName('name')?.text || name;
                const params = node.childForFieldName('parameters');
                if (params) {
                    for (let i = 0; i < params.childCount; i++) {
                        const child = params.child(i)!;
                        if (child.type === 'identifier') {
                            parameters.push(child.text);
                        }
                    }
                }
            } else if (node.type === 'class_definition') {
                type = "class";
                name = node.childForFieldName('name')?.text || name;
            } else if (node.type === 'import_statement' || node.type === 'import_from_statement') {
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

            if (node.type === 'call') {
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

            if (node.type === 'import_statement' || node.type === 'import_from_statement') {
                relationships.push({
                    repoId,
                    fromName: filePath.split('/').pop() || filePath,
                    fromFilePath: filePath,
                    toName: node.text.replace('import ', '').replace('from ', '').split(' ')[0],
                    relationType: "imports",
                    line: node.startPosition.row + 1
                });
            }

            for (let i = 0; i < node.childCount; i++) {
                walk(node.child(i)!, depth + (this.isScopeNode(node) ? 1 : 0), this.getScopeName(node) || parentName);
            }
        };

        if (tree.rootNode) walk(tree.rootNode, 0, null);

        return { entities, relationships, fileMetadata };
    }

    private isScopeNode(node: Parser.SyntaxNode) {
        return ['function_definition', 'class_definition'].includes(node.type);
    }
    
    private getScopeName(node: Parser.SyntaxNode) {
        if (node.type === 'function_definition' || node.type === 'class_definition') {
            return node.childForFieldName('name')?.text || null;
        }
        return null;
    }
}

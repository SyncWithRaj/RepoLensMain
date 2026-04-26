import Parser from "tree-sitter";
import Rust from "tree-sitter-rust";
import { BaseParser, type ParsedEntity, type ParsedRelationship, type ParsedFileMetadata } from "./BaseParser";

export class RustParser extends BaseParser {
    private parser: Parser;

    constructor() {
        super();
        this.parser = new Parser();
        this.parser.setLanguage(Rust);
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

            if (node.type === 'function_item' || node.type === 'function_signature_item') {
                type = "function";
                name = node.childForFieldName('name')?.text || name;
            } else if (node.type === 'struct_item' || node.type === 'enum_item' || node.type === 'trait_item') {
                type = node.type === 'enum_item' ? "enum" : (node.type === 'trait_item' ? "interface" : "class");
                name = node.childForFieldName('name')?.text || name;
            } else if (node.type === 'use_declaration') {
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

            if (node.type === 'use_declaration') {
                relationships.push({
                    repoId,
                    fromName: filePath.split('/').pop() || filePath,
                    fromFilePath: filePath,
                    toName: node.text.replace('use ', '').replace(';', '').trim(),
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
        return ['function_item', 'impl_item'].includes(node.type);
    }
    
    private getScopeName(node: Parser.SyntaxNode) {
        if (node.type === 'function_item') {
            return node.childForFieldName('name')?.text || null;
        }
        if (node.type === 'impl_item') {
            return node.childForFieldName('type')?.text || null;
        }
        return null;
    }
}

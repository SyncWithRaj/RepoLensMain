import Parser from "tree-sitter";
import TypeScript from "tree-sitter-typescript";
import { BaseParser, type ParsedEntity, type ParsedRelationship, type ParsedFileMetadata } from "./BaseParser";

export class TypeScriptParser extends BaseParser {
    private parser: Parser;

    constructor(isTsx: boolean = false) {
        super();
        this.parser = new Parser();
        this.parser.setLanguage(isTsx ? TypeScript.tsx : TypeScript.typescript);
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
            let returnType = "any";

            if (node.type === 'function_declaration') {
                type = "function";
                name = node.childForFieldName('name')?.text || name;
                parameters = this.extractParameters(node.childForFieldName('parameters'));
            } else if (node.type === 'arrow_function') {
                type = "arrow";
                if (node.parent?.type === 'variable_declarator') {
                    name = node.parent.childForFieldName('name')?.text || name;
                }
                parameters = this.extractParameters(node.childForFieldName('parameters'));
            } else if (node.type === 'method_definition') {
                type = "method";
                name = node.childForFieldName('name')?.text || name;
                parameters = this.extractParameters(node.childForFieldName('parameters'));
            } else if (node.type === 'class_declaration') {
                type = "class";
                name = node.childForFieldName('name')?.text || name;
            } else if (node.type === 'variable_declarator') {
                if (node.parent?.parent?.type === 'program' || node.parent?.parent?.type === 'export_statement') {
                    type = "variable";
                    name = node.childForFieldName('name')?.text || name;
                }
            } else if (node.type === 'import_statement') {
                type = "import";
                name = "import";
                const source = node.childForFieldName('source')?.text;
                if (source) returnType = source.replace(/['"`]/g, "");
            }

            if (type) {
                entities.push({
                    repoId,
                    filePath,
                    name,
                    type: type as any,
                    parameters,
                    returnType,
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

            if (node.type === 'import_statement') {
                const source = node.childForFieldName('source')?.text;
                if (source && (source.startsWith("'.") || source.startsWith('".') || source.startsWith('`.'))) {
                    relationships.push({
                        repoId,
                        fromName: filePath.split('/').pop() || filePath,
                        fromFilePath: filePath,
                        toName: source.replace(/['"`]/g, ""),
                        relationType: "imports",
                        line: node.startPosition.row + 1
                    });
                }
            }

            for (let i = 0; i < node.childCount; i++) {
                walk(node.child(i)!, depth + (this.isScopeNode(node) ? 1 : 0), this.getScopeName(node) || parentName);
            }
        };

        if (tree.rootNode) {
            walk(tree.rootNode, 0, null);
        }

        return { entities, relationships, fileMetadata };
    }

    private isScopeNode(node: Parser.SyntaxNode) {
        return ['function_declaration', 'method_definition', 'arrow_function', 'class_declaration'].includes(node.type);
    }
    
    private getScopeName(node: Parser.SyntaxNode) {
        if (node.type === 'function_declaration' || node.type === 'class_declaration' || node.type === 'method_definition') {
            return node.childForFieldName('name')?.text || null;
        }
        if (node.type === 'arrow_function' && node.parent?.type === 'variable_declarator') {
            return node.parent.childForFieldName('name')?.text || null;
        }
        return null;
    }

    private extractParameters(paramsNode: Parser.SyntaxNode | null): string[] {
        if (!paramsNode) return [];
        const params: string[] = [];
        for (let i = 0; i < paramsNode.childCount; i++) {
            const child = paramsNode.child(i)!;
            if (child.type === 'required_parameter' || child.type === 'optional_parameter' || child.type === 'identifier') {
                const nameNode = child.type === 'identifier' ? child : child.child(0);
                if (nameNode) params.push(nameNode.text);
            } else if (child.type === 'formal_parameters') {
                return this.extractParameters(child);
            }
        }
        return params;
    }
}

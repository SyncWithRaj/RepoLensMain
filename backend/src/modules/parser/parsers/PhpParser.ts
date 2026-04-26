import Parser from "tree-sitter";
import Php from "tree-sitter-php";
import { BaseParser, type ParsedEntity, type ParsedRelationship, type ParsedFileMetadata } from "./BaseParser";

export class PhpParser extends BaseParser {
    private parser: Parser;
    constructor() { super(); this.parser = new Parser(); this.parser.setLanguage(Php.php); }
    async parse(repoId: string, filePath: string, content: string): Promise<{ entities: ParsedEntity[]; relationships: ParsedRelationship[]; fileMetadata: ParsedFileMetadata; }> {
        const fileMetadata = this.extractFileMetadata(repoId, filePath, content);
        const tree = this.parser.parse(content);
        const entities: ParsedEntity[] = []; const relationships: ParsedRelationship[] = []; const seen = new Set<string>();

        const walk = (node: Parser.SyntaxNode, depth: number, parentName: string | null) => {
            const key = `${filePath}:${node.startPosition.row}:${node.type}`;
            if (seen.has(key)) return; seen.add(key);
            let type: string | null = null; let name = "anonymous";
            if (node.type === 'function_definition' || node.type === 'method_declaration') {
                type = node.type === 'method_declaration' ? 'method' : 'function';
                name = node.childForFieldName('name')?.text || name;
            } else if (node.type === 'class_declaration' || node.type === 'interface_declaration') {
                type = node.type === 'interface_declaration' ? 'interface' : 'class';
                name = node.childForFieldName('name')?.text || name;
            } else if (node.type === 'namespace_use_declaration') {
                type = "import"; name = "import";
            }
            if (type) {
                entities.push({ repoId, filePath, name, type: type as any, parameters: [], returnType: "any", startLine: node.startPosition.row + 1, endLine: node.endPosition.row + 1, content: node.text, scopeDepth: depth, parentName });
            }
            for (let i = 0; i < node.childCount; i++) {
                walk(node.child(i)!, depth + (this.isScopeNode(node) ? 1 : 0), this.getScopeName(node) || parentName);
            }
        };
        if (tree.rootNode) walk(tree.rootNode, 0, null);
        return { entities, relationships, fileMetadata };
    }
    private isScopeNode(node: Parser.SyntaxNode) { return ['function_definition', 'method_declaration', 'class_declaration'].includes(node.type); }
    private getScopeName(node: Parser.SyntaxNode) {
        if (['function_definition', 'method_declaration', 'class_declaration'].includes(node.type)) { return node.childForFieldName('name')?.text || null; }
        return null;
    }
}

import { Project, Node, SyntaxKind } from "ts-morph";
import ts from "typescript"
import fs from "fs";
export type ParsedEntity = {
    repoId: string;
    filePath: string;
    name: string;
    type: "function" | "class" | "method" | "constructor" | "property" | "staticMethod" | "arrow" | "interface" | "typeAlias" | "enum" | "variable" | "import" | "export" | "route" | "css" | "html";
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
    relationType: "calls" | "accesses" | "imports";
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

const ROUTE_METHODS = ["get", "post", "put", "delete", "patch", "use"];

function extractFileMetadata(repoId: string, sourceFile: any) {

    const filePath = sourceFile.getFilePath();
    const fileName = filePath.split("/").pop() || "";

    const text = sourceFile.getFullText();

    const stats = fs.statSync(filePath);

    const totalLines = sourceFile.getFullText().split("\n").length;

    const hasDefaultExport =
        sourceFile.getExportAssignments().length > 0 ||
        sourceFile.getDefaultExportSymbol() !== undefined;

    const hasReactComponent =
        text.includes("React") ||
        text.includes("useState") ||
        text.includes("useEffect") ||
        sourceFile.getDescendantsOfKind(ts.SyntaxKind.JsxElement).length > 0;

    const isBackendFile =
        filePath.includes("controller") ||
        filePath.includes("service") ||
        filePath.includes("route") ||
        filePath.includes("model");

    const isTestFile =
        filePath.includes(".test.") ||
        filePath.includes(".spec.") ||
        filePath.includes("__tests__");

    return {
        repoId,
        filePath,
        fileName,
        fileSize: stats.size,
        totalLines,
        hasDefaultExport,
        hasReactComponent,
        isBackendFile,
        isTestFile
    };
}

export async function parseRepository(
    repoId: string,
    filePaths: string[]
): Promise<{
    entities: ParsedEntity[];
    relationships: ParsedRelationship[];
    fileMetadata: ParsedFileMetadata[];
}> {
    const project = new Project({
        compilerOptions: {
            allowJs: true,
            checkJs: false,

            jsx: ts.JsxEmit.ReactJSX,
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.ESNext,
            moduleResolution: ts.ModuleResolutionKind.NodeJs,

            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
            skipLibCheck: true,
        },
        skipAddingFilesFromTsConfig: true,
    });

    project.addSourceFilesAtPaths(filePaths);

    const entities: ParsedEntity[] = [];
    const relationships: ParsedRelationship[] = [];
    const fileMetadata: ParsedFileMetadata[] = [];
    const seen = new Set<string>();

    for (const sourceFile of project.getSourceFiles()) {
        try {
            const metadata = extractFileMetadata(repoId, sourceFile);
            fileMetadata.push(metadata);
            const currentFilePath = sourceFile.getFilePath();

        sourceFile.forEachDescendant((node) => {

            const isRelevant =
                Node.isFunctionDeclaration(node) ||
                Node.isArrowFunction(node) ||
                Node.isFunctionExpression(node) ||
                Node.isMethodDeclaration(node) ||
                Node.isClassDeclaration(node) ||
                Node.isInterfaceDeclaration(node) ||
                Node.isTypeAliasDeclaration(node) ||
                Node.isEnumDeclaration(node) ||
                Node.isVariableDeclaration(node) ||
                Node.isImportDeclaration(node) ||
                Node.isExportDeclaration(node) ||
                Node.isExportAssignment(node);

            if (isRelevant) {
                const functionAncestors = node.getAncestors().filter(a =>
                    Node.isFunctionDeclaration(a) ||
                    Node.isArrowFunction(a) ||
                    Node.isFunctionExpression(a) ||
                    Node.isMethodDeclaration(a));


                const scopeDepth = functionAncestors.length;

                let parentName: string | null = null;

                if (functionAncestors.length > 0) {
                    const parent = functionAncestors[functionAncestors.length - 1]

                    if (Node.isFunctionDeclaration(parent)) {
                        parentName = parent.getName() || null;
                    } else if (Node.isMethodDeclaration(parent)) {
                        parentName = parent.getName();
                    } else if (Node.isArrowFunction(parent)) {
                        const p = parent.getParent();
                        if (Node.isVariableDeclaration(p)) {
                            parentName = p.getName();
                        }
                    }
                }

                const key = `${currentFilePath}:${node.getStartLineNumber()}:${node.getKindName()}`;
                if (seen.has(key)) return;
                seen.add(key);

                let returnType = "any";
                try {
                    const typeNode = (node as any).getTypeNode?.();
                    if (typeNode) returnType = typeNode.getText();
                } catch { }

                if (Node.isFunctionDeclaration(node)) {
                    entities.push({
                        repoId,
                        filePath: currentFilePath,
                        name: node.getName() || "Anonymous_Function",
                        type: "function",
                        parameters: node.getParameters().map(p => p.getName()),
                        returnType,
                        startLine: node.getStartLineNumber(),
                        endLine: node.getEndLineNumber(),
                        content: node.getText(),
                        scopeDepth,
                        parentName,
                    });
                }

                if (Node.isArrowFunction(node)) {
                    let name = "anonymous_arrow";

                    const parent = node.getParent();

                    // If assigned to variable → use variable name
                    if (Node.isVariableDeclaration(parent)) {
                        name = parent.getName();
                    }

                    entities.push({
                        repoId,
                        filePath: currentFilePath,
                        name,
                        type: "arrow",
                        parameters: node.getParameters().map(p => p.getName()),
                        returnType,
                        startLine: node.getStartLineNumber(),
                        endLine: node.getEndLineNumber(),
                        content: node.getText(),
                        scopeDepth,
                        parentName
                    })
                }

                if (Node.isFunctionExpression(node)) {
                    let name = "anonymous_function";

                    const parent = node.getParent();

                    if (Node.isVariableDeclaration(parent)) {
                        name = parent.getName();
                    }
                    entities.push({
                        repoId,
                        filePath: currentFilePath,
                        name,
                        type: "function",
                        parameters: node.getParameters().map(p => p.getName()),
                        returnType: node.getReturnType().getText(),
                        startLine: node.getStartLineNumber(),
                        endLine: node.getEndLineNumber(),
                        content: node.getText(),
                        scopeDepth,
                        parentName,
                    })
                }

                if (Node.isClassDeclaration(node)) {
                    entities.push({
                        repoId,
                        filePath: currentFilePath,
                        name: node.getName() || "anonymous_class",
                        type: "class",
                        parameters: [],
                        returnType: "",
                        startLine: node.getStartLineNumber(),
                        endLine: node.getEndLineNumber(),
                        content: node.getText(),
                        scopeDepth,
                        parentName,
                    })
                }

                if (Node.isMethodDeclaration(node)) {
                    entities.push({
                        repoId,
                        filePath: currentFilePath,
                        name: node.getName(),
                        type: "method",
                        parameters: node.getParameters().map(p => p.getName()),
                        returnType: node.getReturnType().getText(),
                        startLine: node.getStartLineNumber(),
                        endLine: node.getEndLineNumber(),
                        content: node.getText(),
                        scopeDepth,
                        parentName,
                    })
                }

                if (Node.isConstructorDeclaration(node)) {
                    const classParent = node.getFirstAncestorByKind(SyntaxKind.ClassDeclaration)

                    entities.push({
                        repoId,
                        filePath: currentFilePath,
                        name: "constructor",
                        type: "constructor",
                        parameters: node.getParameters().map(p => p.getName()),
                        returnType: "",
                        startLine: node.getStartLineNumber(),
                        endLine: node.getEndLineNumber(),
                        content: node.getText(),
                        scopeDepth,
                        parentName: classParent?.getName() || null,
                    })
                }

                if (Node.isPropertyDeclaration(node)) {

                    const classParent = node.getFirstAncestorByKind(SyntaxKind.ClassDeclaration);

                    entities.push({
                        repoId,
                        filePath: currentFilePath,
                        name: node.getName(),
                        type: "property",
                        parameters: [],
                        returnType: node.getType().getText(),
                        startLine: node.getStartLineNumber(),
                        endLine: node.getEndLineNumber(),
                        content: node.getText(),
                        scopeDepth,
                        parentName: classParent?.getName() || null
                    })
                }

                if (Node.isMethodDeclaration(node) && node.isStatic()) {

                    const classParent = node.getFirstAncestorByKind(SyntaxKind.ClassDeclaration);

                    entities.push({
                        repoId,
                        filePath: currentFilePath,
                        name: node.getName(),
                        type: "staticMethod",
                        parameters: node.getParameters().map(p => p.getName()),
                        returnType: node.getReturnType().getText(),
                        startLine: node.getStartLineNumber(),
                        endLine: node.getEndLineNumber(),
                        content: node.getText(),
                        scopeDepth,
                        parentName: classParent?.getName() || null
                    })
                }

                if (Node.isMethodDeclaration(node) && !node.isStatic()) {

                    const classParent = node.getFirstAncestorByKind(SyntaxKind.ClassDeclaration);

                    entities.push({
                        repoId,
                        filePath: currentFilePath,
                        name: node.getName(),
                        type: "method",
                        parameters: node.getParameters().map(p => p.getName()),
                        returnType: node.getReturnType().getText(),
                        startLine: node.getStartLineNumber(),
                        endLine: node.getEndLineNumber(),
                        content: node.getText(),
                        scopeDepth,
                        parentName: classParent?.getName() || null
                    })
                }

                if (Node.isInterfaceDeclaration(node)) {
                    entities.push({
                        repoId,
                        filePath: currentFilePath,
                        name: node.getName(),
                        type: "interface",
                        parameters: [],
                        returnType: "",
                        startLine: node.getStartLineNumber(),
                        endLine: node.getEndLineNumber(),
                        content: node.getText(),
                        scopeDepth,
                        parentName,
                    })
                }

                if (Node.isTypeAliasDeclaration(node)) {
                    entities.push({
                        repoId,
                        filePath: currentFilePath,
                        name: node.getName(),
                        type: "typeAlias",
                        parameters: [],
                        returnType: node.getTypeNode()?.getText() || "",
                        startLine: node.getStartLineNumber(),
                        endLine: node.getEndLineNumber(),
                        content: node.getText(),
                        scopeDepth,
                        parentName,
                    })
                }

                if (Node.isEnumDeclaration(node)) {
                    entities.push({
                        repoId,
                        filePath: currentFilePath,
                        name: node.getName(),
                        type: "enum",
                        parameters: node.getMembers().map(m => m.getName()),
                        returnType: "",
                        startLine: node.getStartLineNumber(),
                        endLine: node.getEndLineNumber(),
                        content: node.getText(),
                        scopeDepth,
                        parentName,
                    })
                }

                if (Node.isVariableDeclaration(node)) {

                    if (!Node.isIdentifier(node.getNameNode())) return;

                    const varStatement = node.getFirstAncestorByKind(SyntaxKind.VariableStatement);
                    if (!varStatement) return;

                    const isTopLevel = varStatement.getParent().getKind() === SyntaxKind.SourceFile;

                    if (!isTopLevel) return;

                    const initializer = node.getInitializer();
                    if (initializer && (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer))) return;

                    if (node.getFirstAncestorByKind(SyntaxKind.CatchClause)) {
                        return;
                    }

                    entities.push({
                        repoId,
                        filePath: currentFilePath,
                        name: node.getName(),
                        type: "variable",
                        parameters: [],
                        returnType: node.getType().getText(),
                        startLine: node.getStartLineNumber(),
                        endLine: node.getEndLineNumber(),
                        content: node.getText(),
                        scopeDepth,
                        parentName,
                    })
                }

                if (Node.isImportDeclaration(node)) {
                    const moduleSpecifier = node.getModuleSpecifierValue();

                    const namedImports = node.getNamedImports().map(i => i.getName())
                    const defaultImport = node.getDefaultImport()?.getText() || null;
                    const namespaceImport = node.getNamespaceImport()?.getText() || null;

                    entities.push({
                        repoId,
                        filePath: currentFilePath,
                        name: defaultImport || namespaceImport || namedImports.join(", ") || "import",
                        type: "import",
                        parameters: [],
                        returnType: moduleSpecifier,
                        startLine: node.getStartLineNumber(),
                        endLine: node.getEndLineNumber(),
                        content: node.getText(),
                        scopeDepth: 0,
                        parentName: null
                    })
                }

                if (Node.isExportDeclaration(node)) {
                    const moduleSpecifier = node.getModuleSpecifierValue();

                    const namedExports = node.getNamedExports().map(e => ({
                        name: e.getName(),
                        alias: e.getAliasNode()?.getText() || null
                    }));

                    entities.push({
                        repoId,
                        filePath: currentFilePath,
                        name: namedExports.map(e => e.alias || e.name).join(", "),
                        type: "export",
                        parameters: [],
                        returnType: moduleSpecifier || "",
                        startLine: node.getStartLineNumber(),
                        endLine: node.getEndLineNumber(),
                        content: node.getText(),
                        scopeDepth,
                        parentName
                    })
                }

                if (Node.isExportAssignment(node)) {
                    entities.push({
                        repoId,
                        filePath: currentFilePath,
                        name: "default_export",
                        type: "export",
                        parameters: [],
                        returnType: "",
                        startLine: node.getStartLineNumber(),
                        endLine: node.getEndLineNumber(),
                        content: node.getText(),
                        scopeDepth,
                        parentName,
                    });
                }
            };

            if (Node.isImportDeclaration(node)) {

                const moduleSpecifier = node.getModuleSpecifierValue();

                // Ignore external packages
                if (!moduleSpecifier.startsWith(".")) return;

                const resolved = node.getModuleSpecifierSourceFile();
                if (!resolved) return;

                const targetFilePath = resolved.getFilePath();

                const fromFileName = currentFilePath.split("/").pop() || currentFilePath;
                const toFileName = targetFilePath.split("/").pop() || targetFilePath;

                relationships.push({
                    repoId,
                    fromName: fromFileName,     // 👈 clean name
                    fromFilePath: currentFilePath,
                    toName: toFileName,         // 👈 clean name
                    toFilePath: targetFilePath,
                    relationType: "imports",
                    line: node.getStartLineNumber(),
                });
            }

            if (Node.isCallExpression(node)) {

                const expression = node.getExpression();

                if (Node.isPropertyAccessExpression(expression)) {

                    const objectName = expression.getExpression().getText();
                    const methodName = expression.getName();

                    if (
                        ROUTE_METHODS.includes(methodName) &&
                        (objectName === "router" || objectName === "app")
                    ) {

                        const args = node.getArguments();

                        const pathArg = args[0];
                        const handlerArg = args[1];

                        const path =
                            pathArg?.getText().replace(/['"`]/g, "") || "";

                        const handler =
                            handlerArg?.getText() || "";

                        entities.push({
                            repoId,
                            filePath: currentFilePath,
                            name: handler || `${methodName}_${path}`,
                            type: "route",
                            parameters: [],
                            returnType: methodName,
                            startLine: node.getStartLineNumber(),
                            endLine: node.getEndLineNumber(),
                            content: node.getText(),
                            scopeDepth: 0,
                            parentName: null
                        });
                    }
                }
            }


            const parentFunc = node.getFirstAncestor((a) =>
                Node.isFunctionDeclaration(a) ||
                Node.isMethodDeclaration(a) ||
                Node.isArrowFunction(a) ||
                Node.isFunctionExpression(a)
            );

            let fromName: string | null = null;

            if (parentFunc) {
                if (Node.isFunctionDeclaration(parentFunc)) {
                    fromName = parentFunc.getName() || "anonymous";
                } else if (Node.isMethodDeclaration(parentFunc)) {
                    fromName = parentFunc.getName();
                } else if (Node.isArrowFunction(parentFunc)) {
                    const p = parentFunc.getParent();
                    if (Node.isVariableDeclaration(p)) {
                        fromName = p.getName();
                    }
                }
            }

            if (!fromName) return;

            if (Node.isCallExpression(node)) {

                const expression = node.getExpression();
                const calledName = expression.getText();

                const symbol = expression.getSymbol();
                let targetFile: string | null = null;

                if (symbol) {
                    const declarations: any = symbol.getDeclarations();
                    if (declarations.length) {
                        targetFile = declarations[0]
                            .getSourceFile()
                            .getFilePath();
                    }
                }

                relationships.push({
                    repoId,
                    fromName,
                    fromFilePath: currentFilePath,
                    toName: calledName,
                    toFilePath: targetFile, // null allowed
                    relationType: "calls",
                    line: node.getStartLineNumber(),
                });
            }

            if (Node.isPropertyAccessExpression(node)) {

                const propertyName = node.getName();

                relationships.push({
                    repoId,
                    fromName,
                    fromFilePath: currentFilePath,
                    toName: propertyName,
                    relationType: "accesses",
                    line: node.getStartLineNumber(),
                });
            }


            // if (Node.isIdentifier(node)) {
            //     if(node.getText().length < 2) return;

            //     const symbol = node.getSymbol();
            //     if (!symbol) return;

            //     const declaration = symbol.getDeclarations()[0];
            //     if (!declaration) return;

            //     relationships.push({
            //         repoId,
            //         fromName: currentFilePath,
            //         fromFilePath: currentFilePath,
            //         toName: node.getText(),
            //         relationType: "uses",
            //         line: node.getStartLineNumber(),
            //     });
            // }
        })
        } catch (err: any) {
            console.error(`[Worker] Failed to parse AST for file ${sourceFile.getFilePath()}:`, err?.message || err);
        }
    }
    return {
        entities,
        relationships,
        fileMetadata
    };
}
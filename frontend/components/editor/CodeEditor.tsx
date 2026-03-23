"use client";

import dynamic from "next/dynamic";
import { useRef, useEffect } from "react";
import { useEditor } from "@/context/EditorContext";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

export default function CodeEditor() {
  const editorRef = useRef<any>(null);
  const decorationsRef = useRef<any[]>([]);
  const { editorState } = useEditor();

  const handleMount = (editor: any) => {
    editorRef.current = editor;
  };

  useEffect(() => {
    if (!editorRef.current) return;

    const editor = editorRef.current;

    // 🧠 ensure model exists
    const model = editor.getModel();
    if (!model) return;

    // 🔥 SCROLL + HIGHLIGHT (only if line present)
    if (editorState?.startLine) {
      setTimeout(() => {
        editor.revealLineInCenter(editorState.startLine);

        decorationsRef.current = editor.deltaDecorations(
          decorationsRef.current,
          [
            {
              range: {
                startLineNumber: editorState.startLine,
                startColumn: 1,
                endLineNumber:
                  editorState.endLine || editorState.startLine,
                endColumn: 1,
              },
              options: {
                isWholeLine: true,
                className: "highlight-line",
              },
            },
          ]
        );
      }, 150);
    }
  }, [editorState]);

  return (
    <MonacoEditor
      key={editorState?.filePath} // 🔥 force reload
      height="100%"
      language={editorState?.language || "javascript"}
      value={editorState?.content || ""}
      onMount={handleMount}
      theme="vs-dark"
    />
  );
}
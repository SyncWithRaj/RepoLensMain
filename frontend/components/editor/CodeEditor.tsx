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
    <div className="flex flex-col h-full w-full bg-[#1e1e1e]">
      {/* VSCode-style Tab Bar */}
      <div className="flex bg-[#18181b] border-b border-[#30363d] overflow-x-auto min-h-[35px] items-end">
        {editorState?.filePath ? (
          <div className="flex items-center gap-2 bg-[#1e1e1e] border-t border-[#007acc] px-3 py-1.5 text-xs text-[#cccccc] min-w-max cursor-pointer border-r border-[#30363d]">
            <svg className="w-3.5 h-3.5 text-[#519aba]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="truncate max-w-[200px]">{editorState.filePath.split('/').pop()}</span>
            <button className="ml-2 hover:bg-[#333333] rounded px-0.5 opacity-0 group-hover:opacity-100 transition">
              <svg className="w-3 h-3 text-[#cccccc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="px-4 py-1.5 text-xs text-[#8b949e] italic">No file open</div>
        )}
      </div>

      <div className="flex-grow relative">
        <MonacoEditor
          key={editorState?.filePath} // 🔥 force reload
          height="100%"
          language={editorState?.language || "javascript"}
          value={editorState?.content || ""}
          onMount={handleMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: "on",
            padding: { top: 16 }
          }}
        />
      </div>
    </div>
  );
}
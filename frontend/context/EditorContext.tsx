"use client";

import { createContext, useContext, useState } from "react";

interface EditorState {
  filePath: string;
  content: string;
  language: string;
  startLine?: number;
  endLine?: number;
}

const EditorContext = createContext<any>(null);

export const EditorProvider = ({ children }: any) => {
  const [editorState, setEditorState] = useState<EditorState | null>(null);

  return (
    <EditorContext.Provider value={{ editorState, setEditorState }}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => useContext(EditorContext);
"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useEditor } from "@/context/EditorContext";
import { getLanguage } from "@/utils/getLanguage";

export default function FileExplorer({ repoId }: any) {
  const [files, setFiles] = useState<any[]>([]);
  const { setEditorState } = useEditor();

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await api.get(`/files/tree/${repoId}`);
        setFiles(res.data.files);
      } catch (err) {
        console.error("Fetch files error:", err);
      }
    };
    fetchFiles();
  }, [repoId]);

  const openFile = async (path: string) => {
    try {
      const res = await api.get(`/files/content`, {
        params: { repoId, path }
      });
      setEditorState({
        filePath: path,
        content: res.data.content,
        language: getLanguage(path),
      });
    } catch (err) {
      console.error("Open file error:", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#18181b]">
      <div className="p-3 border-b border-[#30363d] bg-[#18181b] sticky top-0 z-10 flex items-center justify-between">
        <h3 className="text-[11px] font-bold tracking-wider uppercase text-[#8b949e]">
          Explorer
        </h3>
      </div>
      <div className="py-2 text-sm overflow-y-auto flex-grow flex flex-col">
        {files.length === 0 ? (
          <div className="px-5 py-2 text-[#8b949e] italic text-xs">No files available</div>
        ) : (
          files.map((f, i) => (
            <div
              key={i}
              onClick={() => openFile(f.path)}
              className="flex items-center gap-2 px-5 py-1 cursor-pointer text-[#cccccc] hover:bg-[#2a2d2e] hover:text-white transition group"
            >
              <svg className="w-3.5 h-3.5 text-[#519aba] group-hover:text-[#58a6ff] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="truncate" title={f.name}>{f.name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
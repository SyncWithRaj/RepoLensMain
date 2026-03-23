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
      const res = await api.get(`/files/tree/${repoId}`);
      setFiles(res.data.files);
    };
    fetchFiles();
  }, []);

  const openFile = async (path: string) => {

    const res = await api.get(`/files/content`, {
      params: { repoId, path }
    });

    setEditorState({
      filePath: path,
      content: res.data.content,
      language: getLanguage(path),
    });
  };

  return (
    <div className="p-3 text-sm">
      {files.map((f, i) => (
        <div
          key={i}
          onClick={() => openFile(f.path)}
          className="cursor-pointer hover:text-purple-400"
        >
          {f.name}
        </div>
      ))}
    </div>
  );
}
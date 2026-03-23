"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";

import GraphView from "@/components/graph/GraphView";
import CodeEditor from "@/components/editor/CodeEditor";
import { Panel, Group, Separator } from "react-resizable-panels";
import { Network, MessageSquare, Settings, X, Files } from "lucide-react";
import { useEditor } from "@/context/EditorContext";
import Link from "next/link";

export default function GraphPage() {
  const { repoId } = useParams();
  const router = useRouter();
  const { editorState, setEditorState } = useEditor();
  const [repoValid, setRepoValid] = useState<boolean | null>(null);

  useEffect(() => {
    const checkRepo = async () => {
      try {
        const res = await api.get(`/repos/${repoId}`);
        if (res.data.repo) setRepoValid(true);
        else router.push("/404");
      } catch {
        router.push("/404");
      }
    };
    if (repoId) checkRepo();
  }, [repoId]);

  if (repoValid === null) {
    return (
      <div className="h-screen flex items-center justify-center text-[#c9d1d9] bg-[#010409]">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-8 w-8 text-[#58a6ff] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Loading Workspace...</p>
        </div>
      </div>
    );
  }

  const closeEditor = () => {
    setEditorState(null);
  };

  return (
    <div className="flex flex-grow overflow-hidden bg-[#010409] text-[#c9d1d9] font-sans h-screen p-2 gap-2">
      {/* Activity Bar */}
      <div className="w-[50px] min-w-[50px] flex flex-col items-center py-4 bg-[#0d1117] rounded-xl border border-[#30363d] shadow-sm z-10 space-y-4">
        <Link href={`/chat/${repoId}`} className="p-2 rounded-xl transition text-[#8b949e] hover:text-[#c9d1d9]" title="Chat Interface">
          <MessageSquare size={22} strokeWidth={1.5} />
        </Link>
        <button className="p-2 rounded-xl transition text-white bg-[#21262d] shadow-sm border border-[#30363d]" title="Graph View">
          <Network size={22} strokeWidth={1.5} />
        </button>
        <div className="flex-grow"></div>
        <button className="p-2 text-[#8b949e] hover:text-[#c9d1d9] transition rounded-xl mb-2" title="Settings">
          <Settings size={22} strokeWidth={1.5} />
        </button>
      </div>

      {/* Main Resizable Area */}
      <div className="flex-grow h-full overflow-hidden">
        <Group orientation="horizontal" className="w-full h-full">
          
          {/* Force Graph View */}
          <Panel className="h-full">
            <div className="h-full bg-[#0d1117] rounded-xl border border-[#30363d] overflow-hidden shadow-sm flex flex-col">
              <GraphView repoId={repoId as string} />
            </div>
          </Panel>

          {/* Sliding Editor Panel */}
          {editorState?.filePath && (
            <>
              <Separator className="w-2 flex items-center justify-center cursor-col-resize group relative hover:opacity-100 transition-opacity">
                <div className="h-10 w-1 bg-[#30363d] rounded-full group-hover:bg-[#58a6ff] transition-colors" />
              </Separator>

              <Panel defaultSize={40} minSize={25} className="h-full pl-1">
                <div className="h-full bg-[#0d1117] rounded-xl border border-[#30363d] overflow-hidden shadow-sm flex flex-col relative">
                  
                  {/* File Header with Close Button */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-[#30363d] bg-[#161b22]">
                    <div className="flex items-center gap-2 text-sm text-[#c9d1d9]">
                      <Files size={16} className="text-[#8b949e]" />
                      <span className="truncate max-w-[200px]">{editorState.filePath.split("/").pop()}</span>
                    </div>
                    <button onClick={closeEditor} className="p-1 hover:bg-[#30363d] rounded transition text-[#8b949e] hover:text-[#c9d1d9]">
                      <X size={16} />
                    </button>
                  </div>

                  {/* Monaco Editor */}
                  <div className="flex-grow overflow-hidden">
                    <CodeEditor />
                  </div>
                </div>
              </Panel>
            </>
          )}

        </Group>
      </div>
    </div>
  );
}

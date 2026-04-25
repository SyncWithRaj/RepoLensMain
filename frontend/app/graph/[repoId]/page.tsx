"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";

import GraphView from "@/components/graph/GraphView";
import CodeEditor from "@/components/editor/CodeEditor";
import DesignDocModal from "@/components/graph/DesignDocModal";
import { Panel, Group, Separator } from "react-resizable-panels";
import { Network, Settings, X, Files, FileText } from "lucide-react";
import { useEditor } from "@/context/EditorContext";

export default function GraphPage() {
  const { repoId } = useParams();
  const router = useRouter();
  const { editorState, setEditorState } = useEditor();
  const [repoValid, setRepoValid] = useState<boolean | null>(null);
  const [isDesignDocOpen, setIsDesignDocOpen] = useState(false);

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
          <p className="animate-pulse">Loading Graph Visualization...</p>
        </div>
      </div>
    );
  }

  const closeEditor = () => {
    setEditorState(null);
  };

  return (
    <div className="flex flex-grow overflow-hidden bg-[#010409] text-[#c9d1d9] font-sans h-[calc(100vh-700px)] p-2 gap-2 mt-22">
      {/* Activity Bar */}
      <div className="w-[50px] min-w-[50px] flex flex-col items-center py-4 bg-[#0d1117] rounded-xl border border-[#30363d] shadow-sm z-10 space-y-4">
        <button 
          className="p-2 rounded-xl transition text-[#58a6ff] bg-[#21262d] shadow-sm border border-[#30363d] hover:scale-105"
          title="Graph View"
        >
          <Network size={22} strokeWidth={1.5} />
        </button>
        <button 
          onClick={() => setIsDesignDocOpen(true)}
          className="p-2 rounded-xl transition text-[#8b949e] hover:text-[#58a6ff] hover:bg-[#21262d] hover:scale-105"
          title="Generate System Design Docs"
        >
          <FileText size={22} strokeWidth={1.5} />
        </button>
        <div className="flex-grow"></div>
        <button className="p-2 text-[#8b949e] hover:text-[#c9d1d9] transition rounded-xl mb-2 hover:scale-110" title="Settings">
          <Settings size={22} strokeWidth={1.5} />
        </button>
      </div>

      {/* Main Resizable Area */}
      <div className="flex-grow h-full overflow-hidden">
        <Group orientation="horizontal" className="w-full h-full">

          {/* Center Area (Graph) */}
          <Panel id="graph" defaultSize={60} minSize={20} className="h-full min-w-[200px]">
             <div className="h-full bg-[#0d1117] rounded-xl border border-[#30363d] overflow-hidden shadow-sm flex flex-col relative group">
               <GraphView repoId={repoId as string} />
             </div>
          </Panel>

          {/* Sliding Editor Panel (Unconditional Layout, Condition on Data) */}
          <Separator className="w-2 flex items-center justify-center cursor-col-resize group relative hover:opacity-100 transition-opacity">
            <div className="h-10 w-1 bg-[#30363d] rounded-full group-hover:bg-[#58a6ff] transition-colors" />
          </Separator>

          <Panel id="editor" defaultSize={40} minSize={20} className="h-full">
            <div className="h-full bg-[#0d1117] rounded-xl border border-[#30363d] overflow-hidden shadow-sm flex flex-col relative focus-within:ring-1 focus-within:ring-[#58a6ff] transition-shadow">
              
              {/* File Header with Close Button */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#30363d] bg-[#161b22]">
                <div className="flex items-center gap-2 text-sm text-[#c9d1d9]">
                  <Files size={16} className="text-[#8b949e]" />
                  <span className="truncate max-w-[200px] font-mono text-xs text-[#58a6ff]">{editorState?.filePath ? editorState.filePath.split("/").pop() : "No Context Selected"}</span>
                </div>
                {editorState?.filePath && (
                  <button onClick={closeEditor} className="p-1.5 hover:bg-[#30363d] rounded-md transition text-[#8b949e] hover:text-[#ff7b72]">
                    <X size={16} strokeWidth={2} />
                  </button>
                )}
              </div>

              {/* Monaco Editor */}
              <div className="flex-grow overflow-hidden custom-scrollbar">
                <CodeEditor />
              </div>
            </div>
          </Panel>

        </Group>
      </div>

      <DesignDocModal 
        repoId={repoId as string} 
        isOpen={isDesignDocOpen} 
        onClose={() => setIsDesignDocOpen(false)} 
      />
    </div>
  );
}

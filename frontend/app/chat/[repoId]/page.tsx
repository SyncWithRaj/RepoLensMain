"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";

import CodeEditor from "@/components/editor/CodeEditor";
import FileExplorer from "@/components/files/FileExplorer";
import ChatPanel from "@/components/chat/ChatPanel";
import { Panel, Group, Separator } from "react-resizable-panels";
import { Files, MessageSquare, Settings } from "lucide-react";
import { useEditor } from "@/context/EditorContext";

const getLanguage = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    js: 'javascript', jsx: 'javascript',
    ts: 'typescript', tsx: 'typescript',
    py: 'python', rb: 'ruby', java: 'java',
    go: 'go', rs: 'rust', c: 'c', cpp: 'cpp',
    html: 'html', css: 'css', json: 'json', md: 'markdown'
  };
  return map[ext || ''] || 'plaintext';
};

export default function ChatPage() {
  const { repoId } = useParams();
  const router = useRouter();
  const { setEditorState } = useEditor();

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
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

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/query/ask", {
        repoId,
        question: input,
      });

      const aiMsg = {
        role: "assistant",
        content: res.data.answer,
        references: res.data.references || [],
      };

      if (res.data.references?.length > 0) {
        const ref = res.data.references[0];

        const fileRes = await api.get("/files/content", {
          params: { repoId, path: ref.file },
        });

        setEditorState({
          filePath: ref.file,
          content: fileRes.data.content,
          language: getLanguage(ref.file),
        });

        setTimeout(() => {
          setEditorState((prev: any) => ({
            ...prev,
            startLine: ref.startLine,
            endLine: ref.endLine,
          }));
        }, 100);
      }

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error" },
      ]);
    }

    setLoading(false);
  };

  const [activeSidebar, setActiveSidebar] = useState<"files" | "none">("files");
  const [showChat, setShowChat] = useState(true);

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

  const toggleSidebar = () => setActiveSidebar(prev => prev === "files" ? "none" : "files");
  const toggleChat = () => setShowChat(!showChat);

  return (
    <div className="flex flex-grow overflow-hidden bg-[#010409] text-[#c9d1d9] font-sans h-screen p-2 gap-2">
      
      {/* Activity Bar (VSCode style) */}
      <div className="w-[50px] min-w-[50px] flex flex-col items-center py-4 bg-[#0d1117] rounded-xl border border-[#30363d] shadow-sm z-10 space-y-4">
        <button 
          onClick={toggleSidebar}
          className={`p-2 rounded-xl transition ${activeSidebar === "files" ? "text-white bg-[#21262d] shadow-sm border border-[#30363d]" : "text-[#8b949e] hover:text-[#c9d1d9]"}`}
          title="Explorer"
        >
          <Files size={22} strokeWidth={1.5} />
        </button>
        <button 
          onClick={toggleChat}
          className={`p-2 rounded-xl transition ${showChat ? "text-white bg-[#21262d] shadow-sm border border-[#30363d]" : "text-[#8b949e] hover:text-[#c9d1d9]"}`}
          title="Chat Panel"
        >
          <MessageSquare size={22} strokeWidth={1.5} />
        </button>
        <div className="flex-grow"></div>
        <button className="p-2 text-[#8b949e] hover:text-[#c9d1d9] transition rounded-xl mb-2" title="Settings">
          <Settings size={22} strokeWidth={1.5} />
        </button>
      </div>

      {/* Resizable Panels Container */}
      <div className="flex-grow h-full overflow-hidden">
        <Group orientation="horizontal" className="w-full h-full">
          {/* File Explorer Panel */}
          {activeSidebar === "files" && (
            <>
              <Panel defaultSize={20} minSize={15} className="h-full pr-1">
                <div className="h-full bg-[#0d1117] rounded-xl border border-[#30363d] overflow-hidden shadow-sm flex flex-col">
                  <FileExplorer repoId={repoId} />
                </div>
              </Panel>

              <Separator className="w-2 flex items-center justify-center cursor-col-resize group relative hover:opacity-100 transition-opacity">
                <div className="h-10 w-1 bg-[#30363d] rounded-full group-hover:bg-[#58a6ff] transition-colors" />
              </Separator>
            </>
          )}

          {/* Code Editor Panel */}
          <Panel className="h-full px-1 min-w-[200px]">
            <div className="h-full bg-[#0d1117] rounded-xl border border-[#30363d] overflow-hidden shadow-sm flex flex-col pt-0">
              <CodeEditor />
            </div>
          </Panel>

          {/* Chat Panel */}
          {showChat && (
            <>
              <Separator className="w-2 flex items-center justify-center cursor-col-resize group relative hover:opacity-100 transition-opacity">
                <div className="h-10 w-1 bg-[#30363d] rounded-full group-hover:bg-[#58a6ff] transition-colors" />
              </Separator>
              
              <Panel defaultSize={30} minSize={20} className="h-full pl-1">
                <div className="h-full bg-[#0d1117] rounded-xl border border-[#30363d] overflow-hidden shadow-sm flex flex-col">
                  <ChatPanel
                    repoId={repoId}
                    messages={messages}
                    input={input}
                    setInput={setInput}
                    sendMessage={sendMessage}
                    loading={loading}
                  />
                </div>
              </Panel>
            </>
          )}
        </Group>
      </div>
    </div>
  );
}
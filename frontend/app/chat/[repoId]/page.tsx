"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";

import CodeEditor from "@/components/editor/CodeEditor";
import FileExplorer from "@/components/files/FileExplorer";
import ChatPanel from "@/components/chat/ChatPanel";

export default function ChatPage() {
  const { repoId } = useParams();
  const router = useRouter();

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

  if (repoValid === null) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black text-white">
      {/* LEFT */}
      <div className="w-1/5 border-r border-zinc-800 overflow-y-auto">
        <FileExplorer repoId={repoId} />
      </div>

      {/* CENTER */}
      <div className="w-3/5">
        <CodeEditor />
      </div>

      {/* RIGHT */}
      <div className="w-1/5 border-l border-zinc-800 flex flex-col">
        <ChatPanel
          repoId={repoId}
          messages={messages}
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
          loading={loading}
        />
      </div>
    </div>
  );
}
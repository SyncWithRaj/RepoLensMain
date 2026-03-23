"use client";

import { useEditor } from "@/context/EditorContext";
import api from "@/lib/axios";
import { getLanguage } from "@/utils/getLanguage";
import { useRef, useEffect } from "react";

export default function ChatPanel({
  repoId,
  messages,
  input,
  setInput,
  sendMessage,
  loading,
}: any) {
  const { setEditorState } = useEditor();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const openReference = async (ref: any) => {
    try {
      const res = await api.get("/files/content", {
        params: { repoId, path: ref.file },
      });

      setEditorState({
        filePath: ref.file,
        content: res.data.content,
        language: getLanguage(ref.file),
      });

      setTimeout(() => {
        setEditorState((prev: any) => ({
          ...prev,
          startLine: ref.startLine,
          endLine: ref.endLine,
        }));
      }, 100);
    } catch (err) {
      console.error("Open reference error:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#18181b]">
      <div className="p-3 border-b border-[#30363d] bg-[#18181b] sticky top-0 z-10 flex flex-row items-center justify-between">
        <h3 className="text-[11px] font-bold tracking-wider uppercase text-[#8b949e] flex items-center gap-2">
          Chat
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 bg-[#18181b] custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-10 w-10 text-[#30363d] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-xs text-[#8b949e]">Ask a question about the code</p>
          </div>
        ) : (
          messages.map((msg: any, i: number) => (
            <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[90%] border rounded-lg overflow-hidden ${
                  msg.role === "user"
                    ? "bg-[#2b2d31] border-transparent"
                    : "bg-[#1e1e1e] border-[#30363d]"
                }`}
              >
                <div className={`px-2.5 py-1 text-[10px] font-semibold flex items-center gap-1.5 ${
                  msg.role === "user" ? "bg-[#2b2d31] text-[#c9d1d9]" : "bg-[#1e1e1e] text-[#58a6ff] border-b border-[#30363d]"
                }`}>
                  {msg.role === "assistant" && (
                     <svg className="w-3 h-3 text-[#58a6ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                     </svg>
                  )}
                  {msg.role === "user" ? "You" : "RepoLens"}
                </div>
                <div className="p-2.5 text-xs text-[#cccccc] whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>
              </div>

              {msg.references && msg.references.length > 0 && (
                <div className="mt-1.5 space-y-1 w-full max-w-[90%] self-start ml-1">
                  {msg.references.map((ref: any, idx: number) => (
                    <div
                      key={idx}
                      onClick={() => openReference(ref)}
                      className="inline-flex items-center gap-1.5 text-[10px] bg-[#2d2d2d] border border-transparent hover:border-[#58a6ff] rounded-[4px] px-1.5 py-0.5 text-[#cccccc] cursor-pointer transition mr-1 mb-1"
                      title="Click to view in editor"
                    >
                      <svg className="w-3 h-3 text-[#519aba]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      {ref.file.split('/').pop()} <span className="text-[#8b949e]">:{ref.startLine}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-start">
            <div className="max-w-[90%] border border-[#30363d] rounded-lg overflow-hidden bg-[#1e1e1e]">
              <div className="px-2.5 py-1 text-[10px] font-semibold border-b border-[#30363d] bg-[#1e1e1e] text-[#58a6ff] flex items-center gap-1.5">
                <svg className="w-3 h-3 text-[#58a6ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                RepoLens
              </div>
              <div className="p-2.5 text-xs text-[#8b949e] flex items-center gap-2">
                <svg className="animate-spin h-3.5 w-3.5 text-[#8b949e]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Thinking...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-[#18181b] border-t border-[#30363d]">
        <div className="bg-[#1e1e1e] border border-[#30363d] rounded-[4px] focus-within:border-[#007acc] transition overflow-hidden flex flex-col">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className="w-full bg-transparent p-2 text-xs text-[#cccccc] focus:outline-none resize-none min-h-[60px]"
            disabled={loading}
          />
          <div className="flex justify-between items-center px-2 py-1.5 bg-[#1e1e1e]">
            <span className="text-[9px] text-[#8b949e]">
              <kbd className="px-1 border border-[#30363d] rounded-[2px] bg-[#2d2d2d]">Enter</kbd> to send
            </span>
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-[#007acc] hover:bg-[#005a9e] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-[10px] px-3 py-1 rounded-[2px] transition"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
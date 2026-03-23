"use client";

import { useEditor } from "@/context/EditorContext";
import api from "@/lib/axios";
import { getLanguage } from "@/utils/getLanguage";
import { useRef, useEffect } from "react";
import { Send, Bot, User, Code2 } from "lucide-react";

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
        startLine: ref.startLine,
        endLine: ref.endLine
      });
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
    <div className="flex flex-col h-full bg-[#0d1117] relative">
      <div className="p-4 border-b border-[#30363d] bg-[#161b22]/90 backdrop-blur-md sticky top-0 z-10 flex flex-row items-center justify-between shadow-sm">
        <h3 className="text-xs font-bold tracking-widest uppercase text-[#c9d1d9] flex items-center gap-2">
          <Bot size={16} className="text-[#58a6ff]" />
          RepoLens AI
        </h3>
        <div className="w-2 h-2 rounded-full bg-[#2ea043] shadow-[0_0_8px_#2ea043] animate-pulse"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#0d1117] custom-scrollbar relative z-0">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-l from-[#58a6ff]/5 to-transparent blur-3xl pointer-events-none -z-10"></div>
        
        {messages.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-full bg-[#161b22] border border-[#30363d] flex items-center justify-center mb-6 shadow-inner">
               <Bot className="h-8 w-8 text-[#58a6ff]" />
            </div>
            <p className="text-base font-medium text-[#c9d1d9] mb-2">How can I help with this codebase?</p>
            <p className="text-sm text-[#8b949e]">Ask for architecture details, exact files, or component logic.</p>
          </div>
        ) : (
          messages.map((msg: any, i: number) => (
            <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[90%] md:max-w-[85%] rounded-2xl overflow-hidden shadow-sm ${
                  msg.role === "user"
                    ? "bg-[#21262d] border border-[#30363d]/50 rounded-tr-sm"
                    : "bg-[#161b22] border border-[#30363d] rounded-tl-sm shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
                }`}
              >
                <div className={`px-4 py-2 text-[11px] font-bold tracking-wide uppercase flex items-center gap-2 ${
                  msg.role === "user" ? "text-[#c9d1d9] justify-end" : "text-[#58a6ff] border-b border-[#30363d]/50 bg-[#0d1117]/50"
                }`}>
                  {msg.role === "assistant" && <Bot size={14} className="text-[#58a6ff]" />}
                  {msg.role === "user" ? "You" : "RepoLens"}
                  {msg.role === "user" && <User size={14} className="text-[#8b949e]" />}
                </div>
                <div className="p-4 text-[13px] sm:text-sm text-[#c9d1d9] whitespace-pre-wrap leading-relaxed font-sans">
                  {msg.content}
                </div>
              </div>

              {msg.references && msg.references.length > 0 && (
                <div className="mt-2 space-y-1.5 w-full max-w-[85%] self-start ml-2">
                  <span className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider block mb-1">References</span>
                  <div className="flex flex-wrap gap-2">
                     {msg.references.map((ref: any, idx: number) => (
                       <div
                         key={idx}
                         onClick={() => openReference(ref)}
                         className="inline-flex items-center gap-1.5 text-[11px] bg-[#161b22] border border-[#30363d] hover:border-[#58a6ff] hover:bg-[#58a6ff]/10 rounded-lg px-2.5 py-1.5 text-[#c9d1d9] cursor-pointer transition-all shadow-sm group"
                         title="Click to view in editor"
                       >
                         <Code2 className="w-3.5 h-3.5 text-[#58a6ff] group-hover:scale-110 transition-transform" />
                         <span className="font-mono">{ref.file.split('/').pop()}</span> 
                         <span className="text-[#8b949e] font-mono">L{ref.startLine}</span>
                       </div>
                     ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-start">
            <div className="max-w-[85%] border border-[#30363d] rounded-2xl rounded-tl-sm overflow-hidden bg-[#161b22] shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
              <div className="px-4 py-2 text-[11px] font-bold tracking-wide uppercase border-b border-[#30363d]/50 bg-[#0d1117]/50 text-[#58a6ff] flex items-center gap-2">
                <Bot size={14} className="text-[#58a6ff]" />
                RepoLens
              </div>
              <div className="p-5 text-[13px] text-[#8b949e] flex items-center gap-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-[#58a6ff] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-[#58a6ff] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-[#58a6ff] rounded-full animate-bounce"></div>
                </div>
                Thinking...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 py-4 bg-[#0d1117] border-t border-[#30363d] relative z-10">
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl focus-within:border-[#58a6ff] focus-within:shadow-[0_0_15px_rgba(88,166,255,0.15)] transition-all overflow-hidden flex flex-col shadow-inner">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about this repository..."
            className="w-full bg-transparent p-4 text-[13px] text-[#c9d1d9] focus:outline-none resize-none min-h-[70px] placeholder:text-[#484f58]"
            disabled={loading}
          />
          <div className="flex justify-between items-center px-3 py-2 bg-[#161b22] border-t border-[#30363d]/50">
            <span className="text-[10px] text-[#8b949e] flex items-center gap-1 font-medium">
              <kbd className="px-1.5 py-0.5 border border-[#30363d] rounded bg-[#0d1117] font-mono shadow-sm">Enter</kbd> to send
            </span>
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-[11px] px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
            >
              Send <Send size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
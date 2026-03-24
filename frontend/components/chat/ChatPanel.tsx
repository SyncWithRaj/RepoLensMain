"use client";

import { useEditor } from "@/context/EditorContext";
import api from "@/lib/axios";
import { getLanguage } from "@/utils/getLanguage";
import { useRef, useEffect, useState } from "react";
import { Send, Bot, User, Code2, Mic, Square, Loader2, Phone, MessageSquare, PhoneOff } from "lucide-react";

export default function ChatPanel({
  repoId,
  chatMessages,
  callMessages,
  input,
  setInput,
  sendMessage,
  addCallMessages,
  loading,
}: any) {
  const [activeTab, setActiveTab] = useState<"chat" | "call">("chat");
  const [callState, setCallState] = useState<"idle" | "listening" | "processing" | "speaking">("idle");
  const callStateRef = useRef<string>("idle");

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { setEditorState } = useEditor();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const activeMessages = activeTab === "chat" ? chatMessages : callMessages;

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, callMessages, loading, activeTab]);

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

  const cleanupCall = () => {
    console.log("Call Status: CALL ENDED (Cleaned Up)");
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setCallState("idle");
  };

  const triggerSendAudio = () => {
    if (callStateRef.current === "listening") {
      setCallState("processing");
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    }
  };

  const startListeningPhase = async () => {
    console.log("Call Status: LISTENING");
    try {
      if (callStateRef.current !== "idle" && callStateRef.current !== "speaking") return;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        if (callStateRef.current === "idle") return; // Manually killed
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        
        if (callStateRef.current === "processing") {
            await processAudioMessage(audioBlob);
        }
      };

      mediaRecorder.start();
      setCallState("listening");

    } catch (err) {
      console.error("Microphone error:", err);
      alert("Microphone access denied or unavailable.");
      cleanupCall();
    }
  };

  const processAudioMessage = async (audioBlob: Blob) => {
    console.log("Call Status: PROCESSING AUDIO");
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64data = reader.result?.toString().split(",")[1];
        if (!base64data || callStateRef.current === "idle") return;

        const res = await api.post("/call/process", {
          repoId,
          audioBase64: base64data,
        });

        if (callStateRef.current === "idle") return;

        if (res.data.success) {
          console.log("Call Status: RECEIVED AI ANSWER AND CHUNKS");
          
          const { userText, answer, references, chunks } = res.data;

          if (addCallMessages && userText) {
            addCallMessages([
              { role: "user", content: userText },
              { role: "assistant", content: answer, references: references },
            ]);
            setTimeout(scrollToBottom, 500);
          }

          if (chunks && chunks.length > 0) {
            console.log("Call Status: SPEAKING (TTS PLAYBACK) - CHUNKED QUEUE STARTING");
            setCallState("speaking");
            await playTTSQueue(chunks, 0);
          } else {
            if (callStateRef.current !== "idle") startListeningPhase();
          }
        } else {
          console.error("Error from backend data payload");
          startListeningPhase();
        }
      };
    } catch (err) {
      console.error("Audio processing error:", err);
      startListeningPhase();
    }
  };

  const playTTSQueue = async (audioChunks: string[], index: number = 0) => {
    if (callStateRef.current === "idle") return;

    if (index >= audioChunks.length) {
       console.log("Call Status: FINISHED ALL CHUNKS, RESTARTING LISTENING");
       startListeningPhase();
       return;
    }

    try {
      console.log(`Call Status: FETCHING TTS FOR CHUNK ${index + 1}/${audioChunks.length}`);
      const res = await api.get("/call/tts", {
        params: { text: audioChunks[index] },
        responseType: "blob",
      });

      if (callStateRef.current === "idle") return;

      const audioUrl = window.URL.createObjectURL(new Blob([res.data], { type: "audio/mpeg" }));

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
           playTTSQueue(audioChunks, index + 1);
        };
        await audioRef.current.play();
      } else {
        startListeningPhase();
      }
    } catch (err) {
      console.error("TTS chunk playback failed. Skipping to next...", err);
      playTTSQueue(audioChunks, index + 1);
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
      <div className="border-b border-[#30363d] bg-[#161b22]/90 backdrop-blur-md sticky top-0 z-10 flex flex-col shadow-sm">
        <div className="p-4 flex flex-row items-center justify-between">
          <h3 className="text-xs font-bold tracking-widest uppercase text-[#c9d1d9] flex items-center gap-2">
            <Bot size={16} className="text-[#58a6ff]" />
            RepoLens AI
          </h3>
          <div className="flex items-center gap-2">
            {callState === "listening" && <div className="text-xs text-[#ff5858] font-semibold animate-pulse mr-2 flex items-center gap-1"><Mic size={12}/> Recording</div>}
            {callState === "processing" && <div className="text-xs text-[#58a6ff] font-semibold animate-pulse mr-2 flex items-center gap-1"><Loader2 size={12} className="animate-spin"/> Thinking</div>}
            {callState === "speaking" && <div className="text-xs text-[#a371f7] font-semibold animate-pulse mr-2 flex items-center gap-1"><Bot size={12}/> Speaking</div>}
            <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] animate-pulse ${
                callState === "listening" ? "text-[#ff5858] bg-[#ff5858]" : 
                callState === "processing" ? "text-[#58a6ff] bg-[#58a6ff]" : 
                callState === "speaking" ? "text-[#a371f7] bg-[#a371f7]" : "text-[#2ea043] bg-[#2ea043]"
            }`}></div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-t border-[#30363d]/50">
          <button 
            onClick={() => setActiveTab("chat")} 
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold tracking-widest uppercase transition-colors ${activeTab === "chat" ? "text-[#58a6ff] border-b-2 border-[#58a6ff] bg-[#0d1117]" : "text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]"}`}
          >
            <MessageSquare size={14} />
            Chat
          </button>
          <button 
            onClick={() => setActiveTab("call")} 
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold tracking-widest uppercase transition-colors ${activeTab === "call" ? "text-[#2ea043] border-b-2 border-[#2ea043] bg-[#0d1117]" : "text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]"}`}
          >
            <Phone size={14} />
            Call
          </button>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto p-4 space-y-6 bg-[#0d1117] custom-scrollbar relative z-0 ${activeTab === "call" ? "" : ""}`}>
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-l from-[#58a6ff]/5 to-transparent blur-3xl pointer-events-none -z-10"></div>
        
        {activeMessages.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-full bg-[#161b22] border border-[#30363d] flex items-center justify-center mb-6 shadow-inner">
               <Bot className="h-8 w-8 text-[#58a6ff]" />
            </div>
            <p className="text-base font-medium text-[#c9d1d9] mb-2">{activeTab === "chat" ? "How can I help with this codebase?" : "Speak your mind with RepoLens"}</p>
            <p className="text-sm text-[#8b949e]">{activeTab === "chat" ? "Ask for architecture details, exact files, or component logic." : "I'm listening and ready to dive into the code with you."}</p>
          </div>
        ) : (
          activeMessages.map((msg: any, i: number) => (
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

      {activeTab === "chat" ? (
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
      ) : (
        <div className="px-4 py-8 bg-[#0d1117] border-t border-[#30363d] relative z-10 flex flex-col items-center justify-center min-h-[160px]">
          <audio ref={audioRef} className="hidden" />
          
          {callState === "idle" ? (
            <>
              <button
                 onClick={startListeningPhase}
                 className="w-20 h-20 rounded-full flex items-center justify-center transition-all bg-[#2ea043] border border-[#2ea043] text-white hover:bg-[#238636] hover:scale-105 shadow-[0_0_15px_rgba(46,160,67,0.3)]"
              >
                <Phone size={32} />
              </button>
              <span className="text-xs mt-4 tracking-wide font-medium text-[#8b949e]">
                Tap to Start Call
              </span>
            </>
          ) : (
             <div className="flex flex-col items-center gap-6 w-full">
                <div className="flex items-center gap-6">
                  {callState === "listening" && (
                    <button
                       onClick={triggerSendAudio}
                       className="w-16 h-16 rounded-full flex items-center justify-center transition-all bg-[#58a6ff] text-white shadow-[0_4px_15px_rgba(88,166,255,0.4)] hover:bg-[#3186e8] hover:scale-105"
                       title="Send Audio"
                    >
                       <Send size={24} />
                    </button>
                  )}

                  <div className="relative">
                    {callState === "listening" && (
                       <div className="w-16 h-16 rounded-full bg-[#161b22] border-2 border-[#ff5858] flex items-center justify-center shadow-[0_0_20px_rgba(255,88,88,0.3)] animate-pulse">
                         <Mic className="w-8 h-8 text-[#ff5858]" />
                       </div>
                    )}
                    {callState === "processing" && (
                       <div className="w-16 h-16 rounded-full bg-[#161b22] border-2 border-[#58a6ff] flex items-center justify-center shadow-[0_0_15px_rgba(88,166,255,0.3)]">
                         <Loader2 className="w-8 h-8 text-[#58a6ff] animate-spin" />
                       </div>
                    )}
                    {callState === "speaking" && (
                       <div className="w-16 h-16 rounded-full bg-[#161b22] border-2 border-[#a371f7] flex items-center justify-center shadow-[0_0_15px_rgba(163,113,247,0.3)] animate-pulse">
                         <Bot className="w-8 h-8 text-[#a371f7]" />
                       </div>
                    )}
                  </div>

                  <button
                     onClick={cleanupCall}
                     className="w-16 h-16 rounded-full flex items-center justify-center transition-all bg-[#ff5858] text-white shadow-[0_4px_15px_rgba(255,88,88,0.4)] hover:bg-[#d73a49] hover:scale-105"
                     title="End Call"
                  >
                     <PhoneOff size={24} />
                  </button>
                </div>
                
                <span className={`text-sm tracking-wide font-medium ${
                    callState === "listening" ? "text-[#ff5858]" : 
                    callState === "processing" ? "text-[#58a6ff]" : "text-[#a371f7]"
                }`}>
                  {callState === "listening" && "Listening..."}
                  {callState === "processing" && "Processing..."}
                  {callState === "speaking" && "Agent Speaking..."}
                </span>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
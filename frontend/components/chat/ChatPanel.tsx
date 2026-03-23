"use client";

import { useEditor } from "@/context/EditorContext";
import api from "@/lib/axios";
import { getLanguage } from "@/utils/getLanguage";

export default function ChatPanel({
  repoId,
  messages,
  input,
  setInput,
  sendMessage,
  loading,
}: any) {
  const { setEditorState } = useEditor();

  const openReference = async (ref: any) => {
    // 🔥 STEP 1 — load file FIRST
    const res = await api.get("/files/content", {
      params: { repoId, path: ref.file },
    });

    setEditorState({
      filePath: ref.file,
      content: res.data.content,
      language: getLanguage(ref.file),
    });

    // 🔥 STEP 2 — then highlight (delay)
    setTimeout(() => {
      setEditorState((prev: any) => ({
        ...prev,
        startLine: ref.startLine,
        endLine: ref.endLine,
      }));
    }, 100);
  };

  return (
    <>
      <div className="p-4 border-b border-zinc-800">Chat</div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg: any, i: number) => (
          <div key={i}>
            <div
              className={`p-3 rounded ${
                msg.role === "user"
                  ? "bg-blue-600 ml-auto"
                  : "bg-zinc-800"
              }`}
            >
              {msg.content}
            </div>

            {msg.references?.map((ref: any, idx: number) => (
              <div
                key={idx}
                onClick={() => openReference(ref)}
                className="text-xs text-purple-400 cursor-pointer mt-1 hover:underline"
              >
                📄 {ref.file} → lines {ref.startLine}-{ref.endLine}
              </div>
            ))}
          </div>
        ))}

        {loading && <div>Thinking...</div>}
      </div>

      <div className="p-3 border-t border-zinc-800 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-zinc-900 p-2 rounded"
        />
        <button onClick={sendMessage} className="bg-purple-600 px-3">
          Send
        </button>
      </div>
    </>
  );
}
import React, { useState, useEffect } from "react";
import api from "@/lib/axios";
import { X, BookOpen, Database, Layout, FileCode2, Map, ListOrdered, ChevronRight } from "lucide-react";

interface OnboardingModalProps {
  repoId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface GuideData {
  entryPoints: { file: string; description: string }[];
  mainSchemas: { name: string; file: string; description: string }[];
  coreUIComponents: { name: string; file: string; description: string }[];
  readingList: { order: number; file: string; reason: string }[];
}

const formatPath = (fullPath: string) => {
  if (!fullPath) return "";
  return fullPath.replace(/^\/tmp\/repolens-repos\/[^\/]+\/[^\/]+\//, "");
};

export default function OnboardingModal({ repoId, isOpen, onClose }: OnboardingModalProps) {
  const [loading, setLoading] = useState(true);
  const [guide, setGuide] = useState<GuideData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "walkthrough">("overview");

  useEffect(() => {
    if (!isOpen) return;

    const fetchGuide = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/repos/${repoId}/onboarding`);
        if (res.data.success && res.data.guide) {
          setGuide(res.data.guide);
        } else {
          setError("Failed to parse guide data.");
        }
      } catch (err: any) {
        console.error("Error generating onboarding guide:", err);
        setError(err.response?.data?.message || err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchGuide();
  }, [repoId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0d1117] border border-[#30363d] rounded-xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fadeInUp">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#30363d] bg-[#161b22]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#58a6ff]/10 rounded-lg border border-[#58a6ff]/20">
              <Map className="text-[#58a6ff]" size={20} />
            </div>
            <div>
              <h2 className="text-[#c9d1d9] font-semibold text-lg">Onboarding Guide</h2>
              <p className="text-xs text-[#8b949e]">AI-generated repository walkthrough</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-[#8b949e] hover:text-[#ff7b72] transition rounded p-1 hover:bg-[#30363d]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow flex flex-col overflow-hidden bg-[#010409]">
          {loading ? (
            <div className="flex-grow flex flex-col items-center justify-center text-[#8b949e]">
              <svg className="animate-spin h-10 w-10 text-[#58a6ff] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="animate-pulse font-mono text-sm">Analyzing architecture & generating guide...</p>
            </div>
          ) : error ? (
            <div className="flex-grow flex items-center justify-center p-6">
              <div className="text-[#ff7b72] bg-[#ff7b72]/10 border border-[#ff7b72]/30 p-4 rounded-lg max-w-md text-center whitespace-pre-wrap font-mono text-sm">
                {error}
              </div>
            </div>
          ) : guide ? (
            <div className="flex flex-col h-full overflow-hidden">
              
              {/* Top Tabs */}
              <div className="flex bg-[#0d1117] border-b border-[#30363d] px-6 pt-4 gap-6">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                    activeTab === "overview" 
                      ? "border-[#58a6ff] text-[#58a6ff]" 
                      : "border-transparent text-[#8b949e] hover:text-[#c9d1d9] hover:border-[#8b949e]"
                  }`}
                >
                  <BookOpen size={16} />
                  Architecture Overview
                </button>
                <button
                  onClick={() => setActiveTab("walkthrough")}
                  className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                    activeTab === "walkthrough" 
                      ? "border-[#3fb950] text-[#3fb950]" 
                      : "border-transparent text-[#8b949e] hover:text-[#c9d1d9] hover:border-[#8b949e]"
                  }`}
                >
                  <ListOrdered size={16} />
                  Step-by-Step Tour
                </button>
              </div>

              {/* Main Content Area */}
              <div className="flex-grow overflow-auto p-6 custom-scrollbar">
                
                {activeTab === "overview" && (
                  <div className="space-y-8 animate-fadeIn">
                    
                    <section>
                      <h3 className="flex items-center gap-2 text-[#c9d1d9] font-medium mb-4 pb-2 border-b border-[#30363d]">
                        <FileCode2 size={18} className="text-[#d2a8ff]" />
                        Entry Points
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {guide.entryPoints.map((item, idx) => (
                          <div key={idx} className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl hover:border-[#8b949e] transition">
                            <h4 className="font-mono text-sm text-[#58a6ff] mb-2 break-all">{formatPath(item.file)}</h4>
                            <p className="text-sm text-[#8b949e]">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h3 className="flex items-center gap-2 text-[#c9d1d9] font-medium mb-4 pb-2 border-b border-[#30363d]">
                        <Database size={18} className="text-[#3fb950]" />
                        Main Schemas & Models
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {guide.mainSchemas.map((item, idx) => (
                          <div key={idx} className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl hover:border-[#8b949e] transition">
                            <h4 className="font-semibold text-sm text-[#c9d1d9] mb-1">{item.name}</h4>
                            <h5 className="font-mono text-xs text-[#58a6ff] mb-2 break-all">{formatPath(item.file)}</h5>
                            <p className="text-sm text-[#8b949e]">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h3 className="flex items-center gap-2 text-[#c9d1d9] font-medium mb-4 pb-2 border-b border-[#30363d]">
                        <Layout size={18} className="text-[#ff7b72]" />
                        Core UI Components
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {guide.coreUIComponents.map((item, idx) => (
                          <div key={idx} className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl hover:border-[#8b949e] transition">
                            <h4 className="font-semibold text-sm text-[#c9d1d9] mb-1">{item.name}</h4>
                            <h5 className="font-mono text-xs text-[#58a6ff] mb-2 break-all">{formatPath(item.file)}</h5>
                            <p className="text-sm text-[#8b949e]">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                  </div>
                )}

                {activeTab === "walkthrough" && (
                  <div className="animate-fadeIn max-w-3xl">
                    <div className="mb-6">
                      <h3 className="text-[#c9d1d9] text-lg font-medium">Recommended Reading Order</h3>
                      <p className="text-[#8b949e] text-sm mt-1">Follow this sequence to understand the codebase efficiently.</p>
                    </div>
                    
                    <div className="space-y-4 relative">
                      <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-[#30363d] rounded-full z-0"></div>
                      
                      {guide.readingList.sort((a, b) => a.order - b.order).map((item, idx) => (
                        <div key={idx} className="relative z-10 flex gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#161b22] border-2 border-[#3fb950] text-[#3fb950] flex items-center justify-center font-bold shadow-md">
                            {item.order}
                          </div>
                          <div className="flex-grow bg-[#161b22] border border-[#30363d] p-4 rounded-xl hover:border-[#8b949e] transition mt-1">
                            <h4 className="font-mono text-sm text-[#58a6ff] mb-2 break-all">{formatPath(item.file)}</h4>
                            <p className="text-sm text-[#c9d1d9]">{item.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GitBranch, Box, Loader2, Play, Trash2, Github, MessageSquare, Plus, Info } from "lucide-react";
import api from "@/lib/axios";
import { useToast } from "@/context/ToastContext";

export default function Dashboard() {
    const router = useRouter();

    const [repos, setRepos] = useState<any[]>([]);
    const [githubUrl, setGithubUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [embeddingRepo, setEmbeddingRepo] = useState<string | null>(null);
    const [indexingRepo, setIndexingRepo] = useState<string | null>(null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const { toast } = useToast();

    const fetchRepos = useCallback(async () => {
        try {
            const res = await api.get("/repos");
            const fetchedRepos = res.data.repos || [];
            setRepos(fetchedRepos);

            // Stop polling if no repos are in indexing state
            const hasIndexing = fetchedRepos.some((r: any) => r.status === "indexing");
            if (!hasIndexing && pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
                setIndexingRepo(null);
            }
        } catch (err) {
            console.error("Fetch repos error:", err);
            setRepos([]);
        }
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                await api.get("/auth/me");
                fetchRepos();
            } catch {
                router.push("/login");
            }
        };
        checkAuth();

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    const cloneRepo = async () => {
        if (!githubUrl) return;
        try {
            setLoading(true);
            toast.loading("Cloning repository...");
            await api.post("/repos", { githubUrl });
            setGithubUrl("");
            toast.success("Repository cloned successfully!");
            fetchRepos();
        } catch (err) {
            console.error("Clone repo error:", err);
            toast.error("Failed to clone repository. Check the URL and try again.");
        }
        setLoading(false);
    };

    const indexRepo = async (repoId: string) => {
        try {
            // Optimistic update: immediately set status to indexing
            setIndexingRepo(repoId);
            setRepos(prev => prev.map(r =>
                r._id === repoId ? { ...r, status: "indexing" } : r
            ));
            toast.loading("Indexing repository architecture...");

            // Start polling for status updates
            if (pollingRef.current) clearInterval(pollingRef.current);
            pollingRef.current = setInterval(fetchRepos, 3000);

            await api.post(`/repos/${repoId}/parse`);
            toast.success("Repository indexed successfully!");
            fetchRepos();
        } catch (err) {
            console.error("Index repo error:", err);
            toast.error("Indexing failed. Please try again.");
            fetchRepos();
        }
    };

    const embedRepo = async (repoId: string) => {
        try {
            setEmbeddingRepo(repoId);
            toast.loading("Preparing AI agent for chat...");
            await api.post("/vector/init");
            await api.post(`/embed/${repoId}`);
            toast.success("AI agent ready! Redirecting to chat...");
            router.push(`/chat/${repoId}`);
        } catch (err) {
            console.error("Embed repo error:", err);
            toast.error("Failed to prepare AI agent. Try again.");
        } finally {
            setEmbeddingRepo(null);
        }
    };

    const deleteRepo = async (repoId: string) => {
        const confirmDelete = confirm("Are you sure you want to delete this repository?");
        if (!confirmDelete) return;

        try {
            await api.delete(`/repos/${repoId}`);
            toast.success("Repository deleted successfully");
            fetchRepos();
        } catch (err) {
            console.error("Delete repo error:", err);
            toast.error("Failed to delete repository");
        }
    };

    return (
        <div className="max-w-6xl mt-20 mx-auto w-full py-12 px-6 flex-grow">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-[#30363d]/50">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Box className="text-[#58a6ff]" size={28} />
                        Repositories
                    </h1>
                    <p className="text-[#8b949e] mt-2 text-sm font-medium">Manage and chat with indexed GitHub repositories in your isolated workspace.</p>
                </div>
            </div>

            <div className="mb-8 p-8 bg-gradient-to-br from-[#161b22] to-[#0d1117] border border-[#30363d] rounded-2xl shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }}></div>
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-[#2ea043]/10 to-transparent blur-3xl rounded-full pointer-events-none group-hover:from-[#2ea043]/20 transition-all duration-700"></div>
                
                <h2 className="text-lg font-semibold text-white mb-4 relative z-10 flex items-center gap-2">
                    <Plus size={18} className="text-[#2ea043]" />
                    Clone a new repository
                </h2>
                <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                    <div className="relative flex-grow">
                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Github className="h-5 w-5 text-[#8b949e]" />
                       </div>
                       <input
                           type="text"
                           placeholder="https://github.com/owner/repo.git"
                           value={githubUrl}
                           onChange={(e) => setGithubUrl(e.target.value)}
                           className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#010409]/80 backdrop-blur-sm border border-[#30363d] text-white focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition-all shadow-inner placeholder-[#484f58]"
                       />
                    </div>
                    <button
                        onClick={cloneRepo}
                        disabled={loading || !githubUrl}
                        className="cursor-pointer bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-3.5 rounded-xl transition-all border border-[rgba(240,246,252,0.1)] whitespace-nowrap shadow-[0_0_15px_rgba(35,134,54,0.2)] hover:shadow-[0_0_25px_rgba(46,160,67,0.4)] flex items-center justify-center min-w-[180px]"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Clone Repository"}
                    </button>
                </div>
            </div>

            {/* Language Support Banner */}
            <div className="mb-8 p-4 bg-gradient-to-r from-[#161b22] via-[#1c2333] to-[#161b22] border border-[#30363d]/60 rounded-xl relative overflow-hidden animate-fadeIn">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#58a6ff]/5 to-transparent animate-shimmer pointer-events-none"></div>
                <div className="flex items-start gap-3 relative z-10">
                    <div className="flex-shrink-0 mt-0.5">
                        <Info size={18} className="text-[#58a6ff]" />
                    </div>
                    <div>
                        <p className="text-sm text-[#c9d1d9] font-medium">
                            <span className="text-[#58a6ff] font-semibold">Currently supporting:</span>{" "}
                            JavaScript, TypeScript, HTML, and CSS repositories.
                        </p>
                        <p className="text-xs text-[#8b949e] mt-1">
                            More languages and frameworks will be supported in future updates. Stay tuned! 🚀
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {repos.length === 0 ? (
                    <div className="text-center py-24 px-4 bg-[#0d1117]/50 border-2 border-dashed border-[#30363d]/50 rounded-3xl flex flex-col items-center animate-fadeIn">
                        <div className="w-16 h-16 rounded-full bg-[#161b22] border border-[#30363d] flex items-center justify-center mb-6 shadow-inner">
                           <GitBranch className="h-8 w-8 text-[#8b949e]" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No repositories found</h3>
                        <p className="text-sm text-[#8b949e] max-w-sm">Get started by pasting a public GitHub repository URL above to clone and index it.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {repos.map((repo, index) => (
                          <div
                              key={repo._id}
                              className="group bg-[#0d1117] p-6 rounded-2xl border border-[#30363d] flex flex-col md:flex-row justify-between md:items-center gap-6 hover:bg-[#161b22]/80 transition-all duration-300 shadow-sm hover:shadow-xl hover:border-[#8b949e]/50 relative overflow-hidden animate-fadeInUp"
                              style={{ animationDelay: `${index * 60}ms` }}
                          >
                              {/* Hover glow line */}
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#58a6ff] to-[#a371f7] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              
                              <div className="flex items-start gap-4">
                                  <div className="w-10 h-10 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center shadow-inner group-hover:border-[#58a6ff]/30 transition-colors">
                                     <GitBranch className="w-5 h-5 text-[#8b949e] group-hover:text-[#58a6ff] transition-colors" />
                                  </div>
                                  <div>
                                      <h3 className="text-xl font-bold text-white group-hover:text-[#58a6ff] transition-colors cursor-pointer flex items-center gap-2">
                                          {repo.name}
                                      </h3>
                                      <div className="flex items-center gap-4 mt-2 text-xs text-[#8b949e] font-mono">
                                          <span className="flex items-center gap-2 font-medium bg-[#161b22] px-2.5 py-1 rounded-md border border-[#30363d]">
                                              <span className={`w-2 h-2 rounded-full ${
                                                  repo.status === "cloned" ? "bg-gray-400" :
                                                  repo.status === "indexing" ? "bg-[#e3b341] animate-pulse shadow-[0_0_8px_rgba(227,179,65,0.6)]" :
                                                  repo.status === "indexed" ? "bg-[#2ea043] shadow-[0_0_8px_rgba(46,160,67,0.6)]" : "bg-blue-400"
                                              }`}></span>
                                              {repo.status.toUpperCase()}
                                          </span>
                                      </div>
                                  </div>
                              </div>

                              <div className="flex flex-wrap gap-3 items-center">
                                  {repo.status === "cloned" && (
                                      <button
                                          onClick={() => indexRepo(repo._id)}
                                          className="cursor-pointer flex items-center gap-2 text-sm bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#c9d1d9] hover:text-white font-medium px-5 py-2.5 rounded-xl transition-all shadow-sm"
                                      >
                                          <Play size={16} />
                                          Index Architecture
                                      </button>
                                  )}

                                  {repo.status === "cloning" && (
                                      <span className="flex items-center gap-2 text-sm text-[#e3b341] font-medium px-4 py-2 bg-[#e3b341]/10 rounded-xl border border-[#e3b341]/20">
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                          Cloning...
                                      </span>
                                  )}

                                  {repo.status === "indexing" && (
                                      <button
                                          disabled
                                          className="flex items-center gap-2 text-sm text-[#e3b341] font-medium px-5 py-2.5 bg-[#e3b341]/10 rounded-xl border border-[#e3b341]/20 cursor-not-allowed opacity-80"
                                      >
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                          Indexing...
                                      </button>
                                  )}

                                  {repo.status === "indexed" && (
                                      <>
                                          <button
                                              onClick={() => router.push(`/graph/${repo._id}`)}
                                              className="cursor-pointer flex items-center gap-2 text-sm bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#c9d1d9] hover:text-white font-medium px-5 py-2.5 rounded-xl transition-all shadow-sm"
                                          >
                                              <Box size={16} />
                                              Visualize Network
                                          </button>
                                          <button
                                              onClick={() => embedRepo(repo._id)}
                                              disabled={embeddingRepo === repo._id}
                                              className="cursor-pointer flex items-center gap-2 text-sm bg-[#58a6ff] hover:bg-[#1f6feb] border border-[rgba(240,246,252,0.1)] text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(88,166,255,0.2)] hover:shadow-[0_0_20px_rgba(88,166,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                              {embeddingRepo === repo._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare size={16} />}
                                              {embeddingRepo === repo._id ? "Preparing Agent..." : "Chat with Codebase"}
                                          </button>
                                      </>
                                  )}

                                  <button
                                      onClick={() => deleteRepo(repo._id)}
                                      disabled={repo.status === "indexing"}
                                      className="cursor-pointer flex justify-center items-center w-10 h-10 bg-[#21262d] hover:bg-[#da3633] text-[#8b949e] hover:text-white border border-[#30363d] hover:border-transparent rounded-xl transition-all shadow-sm group/btn ml-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#21262d] disabled:hover:text-[#8b949e]"
                                      title="Delete Repository"
                                  >
                                      <Trash2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                                  </button>
                              </div>
                          </div>
                      ))}
                    </div>
                )}
            </div>
        </div>
    );
}
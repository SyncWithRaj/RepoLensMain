"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

export default function Dashboard() {
    const router = useRouter();

    const [repos, setRepos] = useState<any[]>([]);
    const [githubUrl, setGithubUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [embeddingRepo, setEmbeddingRepo] = useState<string | null>(null);

    const fetchRepos = async () => {
        try {
            const res = await api.get("/repos");
            setRepos(res.data.repos || []);
        } catch (err) {
            console.error("Fetch repos error:", err);
            setRepos([]);
        }
    };

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
    }, []);

    const cloneRepo = async () => {
        if (!githubUrl) return;
        try {
            setLoading(true);
            await api.post("/repos", { githubUrl });
            setGithubUrl("");
            fetchRepos();
        } catch (err) {
            console.error("Clone repo error:", err);
        }
        setLoading(false);
    };

    const indexRepo = async (repoId: string) => {
        try {
            await api.post(`/repos/${repoId}/parse`);
            fetchRepos();
        } catch (err) {
            console.error("Index repo error:", err);
        }
    };

    const embedRepo = async (repoId: string) => {
        try {
            setEmbeddingRepo(repoId);
            // 1️⃣ Ensure vector DB exists
            await api.post("/vector/init");
            // 2️⃣ Run embeddings
            await api.post(`/embed/${repoId}`);
            // 3️⃣ Redirect to chat
            router.push(`/chat/${repoId}`);
        } catch (err) {
            console.error("Embed repo error:", err);
        } finally {
            setEmbeddingRepo(null);
        }
    };

    const deleteRepo = async (repoId: string) => {
        const confirmDelete = confirm("Are you sure you want to delete this repository?");
        if (!confirmDelete) return;

        try {
            await api.delete(`/repos/${repoId}`);
            fetchRepos();
        } catch (err) {
            console.error("Delete repo error:", err);
        }
    };

    return (
        <div className="max-w-6xl mx-auto w-full py-12 px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-[#30363d] pb-6">
                <div>
                    <h1 className="text-3xl font-semibold text-white tracking-tight">Repositories</h1>
                    <p className="text-[#8b949e] mt-1 text-sm">Manage and chat with indexed GitHub repositories.</p>
                </div>
            </div>

            <div className="mb-10 p-8 bg-[#161b22] border border-[#30363d] rounded-2xl shadow-md">
                <h2 className="text-lg font-medium text-white mb-4">Clone a new repository</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="https://github.com/owner/repo"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        className="flex-grow p-3.5 rounded-xl bg-[#010409] border border-[#30363d] text-white focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition shadow-inner"
                    />
                    <button
                        onClick={cloneRepo}
                        disabled={loading || !githubUrl}
                        className="bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-8 py-3.5 rounded-xl transition border border-[rgba(240,246,252,0.1)] whitespace-nowrap shadow-sm hover:shadow-md"
                    >
                        {loading ? "Cloning..." : "Clone Repository"}
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {repos.length === 0 ? (
                    <div className="text-center py-20 px-4 bg-[#0d1117] border border-dashed border-[#30363d] rounded-2xl">
                        <svg className="mx-auto h-12 w-12 text-[#8b949e] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-lg font-medium text-white">No repositories found</h3>
                        <p className="mt-1 text-sm text-[#8b949e]">Get started by cloning a public repository above.</p>
                    </div>
                ) : (
                    repos.map((repo) => (
                        <div
                            key={repo._id}
                            className="bg-[#0d1117] p-6 rounded-2xl border border-[#30363d] flex flex-col md:flex-row justify-between md:items-center gap-4 hover:bg-[#161b22] transition shadow-sm hover:shadow"
                        >
                            <div className="flex items-start gap-4">
                                <svg className="w-5 h-5 text-[#8b949e] mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                                <div>
                                    <h3 className="text-lg font-semibold text-[#58a6ff] hover:underline cursor-pointer">
                                        {repo.name}
                                    </h3>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-[#8b949e]">
                                        <span className="flex items-center gap-2 font-medium">
                                            <span className={`w-2.5 h-2.5 rounded-full ${
                                                repo.status === "cloned" ? "bg-gray-400" :
                                                repo.status === "indexing" ? "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]" :
                                                repo.status === "indexed" ? "bg-[#3fb950] shadow-[0_0_8px_rgba(63,185,80,0.6)]" : "bg-blue-400"
                                            }`}></span>
                                            {repo.status.charAt(0).toUpperCase() + repo.status.slice(1)}
                                        </span>
                                        <span>Read access</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 items-center">
                                {repo.status === "cloned" && (
                                    <button
                                        onClick={() => indexRepo(repo._id)}
                                        className="text-sm bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#c9d1d9] font-medium px-5 py-2.5 rounded-xl transition shadow-sm"
                                    >
                                        Index Repo
                                    </button>
                                )}

                                {repo.status === "cloning" && (
                                    <span className="text-sm text-yellow-400 font-medium px-4 py-2">
                                        Cloning...
                                    </span>
                                )}

                                {repo.status === "indexing" && (
                                    <span className="text-sm text-yellow-400 font-medium px-4 py-2">
                                        Indexing...
                                    </span>
                                )}

                                {repo.status === "indexed" && (
                                    <button
                                        onClick={() => embedRepo(repo._id)}
                                        disabled={embeddingRepo === repo._id}
                                        className="text-sm bg-[#58a6ff] hover:bg-[#1f6feb] border border-[rgba(240,246,252,0.1)] text-white font-medium px-5 py-2.5 rounded-xl transition shadow-sm disabled:opacity-50"
                                    >
                                        {embeddingRepo === repo._id ? "Preparing Chat..." : "Chat with Codebase"}
                                    </button>
                                )}

                                <button
                                    onClick={() => deleteRepo(repo._id)}
                                    className="text-sm bg-[#21262d] hover:bg-[#da3633] hover:text-white hover:border-transparent border border-[#30363d] text-[#c9d1d9] font-medium px-5 py-2.5 rounded-xl transition shadow-sm"
                                    title="Delete Repository"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
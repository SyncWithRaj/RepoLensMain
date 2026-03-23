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
        const confirmDelete = confirm("Delete this repository?");
        if (!confirmDelete) return;

        try {
            await api.delete(`/repos/${repoId}`);
            fetchRepos();
        } catch (err) {
            console.error("Delete repo error:", err);
        }
    };

    const logout = async () => {
        try {
            await api.post("/auth/logout");
            router.push("/login");
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    return (
        <div className="p-10 bg-black min-h-screen text-white">

            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold">
                    RepoLens Dashboard
                </h1>

                <button
                    onClick={logout}
                    className="bg-red-500 px-4 py-2 rounded"
                >
                    Logout
                </button>
            </div>

            <div className="mb-10 flex gap-4">

                <input
                    type="text"
                    placeholder="GitHub repo URL"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="p-3 rounded bg-zinc-800 w-[400px]"
                />

                <button
                    onClick={cloneRepo}
                    disabled={loading}
                    className="bg-white text-black px-4 py-3 rounded"
                >
                    {loading ? "Cloning..." : "Clone Repo"}
                </button>

            </div>

            <h2 className="text-xl mb-4">
                Your Repositories
            </h2>

            {repos.length === 0 && (
                <p className="text-gray-400">
                    No repositories yet
                </p>
            )}

            {repos.map((repo) => (
                <div
                    key={repo._id}
                    className="bg-zinc-900 p-5 mb-4 rounded flex justify-between items-center"
                >

                    <div>
                        <h3 className="font-semibold">
                            {repo.name}
                        </h3>

                        <p className="text-gray-400 text-sm">
                            Status: {repo.status}
                        </p>
                    </div>

                    <div className="flex gap-3 items-center">

                        {repo.status === "cloned" && (
                            <button
                                onClick={() => indexRepo(repo._id)}
                                className="bg-blue-500 px-4 py-2 rounded"
                            >
                                Index Repo
                            </button>
                        )}

                        {repo.status === "cloning" && (
                            <span className="text-yellow-400">
                                Cloning...
                            </span>
                        )}

                        {repo.status === "indexing" && (
                            <span className="text-yellow-400">
                                Indexing...
                            </span>
                        )}

                        {repo.status === "indexed" && (
                            <button
                                onClick={() => embedRepo(repo._id)}
                                disabled={embeddingRepo === repo._id}
                                className="bg-purple-600 px-4 py-2 rounded"
                            >
                                {embeddingRepo === repo._id
                                    ? "Preparing Chat..."
                                    : "Chat with Codebase"}
                            </button>
                        )}

                        <button
                            onClick={() => deleteRepo(repo._id)}
                            className="bg-red-600 px-4 py-2 rounded"
                        >
                            Delete
                        </button>

                    </div>
                </div>
            ))}
        </div>
    );
}
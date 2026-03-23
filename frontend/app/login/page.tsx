"use client"

import api from "@/lib/axios"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function LoginPage() {

    const router = useRouter();

    const loginWithGithub = () => {
        window.location.href = "http://localhost:5000/api/v1/auth/github";
    };

    useEffect(() => {
        const checkAuth = async () => {
            try {
                await api.get("/auth/me");
                router.push("/dashboard")
            } catch (err) {

            }
        }

        checkAuth();
    }, [])

    return (
        <div className="h-screen flex items-center justify-center bg-black text-white">
            <div className="bg-zinc-900 p-10 rounded-xl text-center">
                <h1 className="text-3xl font-bold mb-4">RepoLens</h1>
                <p className="mb-6">chat withyour github codebase using AI</p>
                <button
                    onClick={loginWithGithub}
                    className="bg-white text-black px-6 py-3 rounded-lg"> Login with GitHub</button>
            </div>
        </div>
    )
}
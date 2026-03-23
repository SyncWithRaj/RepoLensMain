"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "@/lib/axios";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.get("/auth/me");
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, [pathname]); // Re-verify on navigation

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      setIsAuthenticated(false);
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <nav className="bg-[#161b22] border-b border-[#30363d] text-[#c9d1d9] px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <Link href="/" className="flex items-center space-x-2 text-white hover:text-gray-300 transition">
          <svg height="32" viewBox="0 0 16 16" version="1.1" width="32" fill="currentColor">
            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
          </svg>
          <span className="font-semibold text-xl tracking-tight">RepoLens</span>
        </Link>
        <div className="hidden md:flex space-x-4">
          <Link href="/about" className="text-sm font-medium hover:text-white transition">About</Link>
          <Link href="/contact" className="text-sm font-medium hover:text-white transition">Contact Us</Link>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {isAuthenticated ? (
          <>
            <Link 
              href="/dashboard" 
              className="text-sm font-medium hover:text-white transition"
            >
              Dashboard
            </Link>
            <button 
              onClick={handleLogout}
              className="text-sm text-[#da3633] hover:text-[#b62324] transition font-medium bg-[#21262d] border border-[#30363d] px-3 py-1.5 rounded-lg shadow-sm"
            >
              Logout
            </button>
          </>
        ) : (
          <Link 
            href="/login" 
            className="text-sm font-medium bg-[#238636] hover:bg-[#2ea043] text-white px-3 py-1.5 rounded-lg border border-[rgba(240,246,252,0.1)] transition shadow-sm"
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}

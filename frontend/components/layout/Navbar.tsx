"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Terminal } from "lucide-react";
import api from "@/lib/axios";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const inWorkspace = pathname.startsWith("/graph") || pathname.startsWith("/chat");

  return (
    <nav 
      className={`sticky top-[15px] mx-[15px] z-50 transition-all duration-300 rounded-2xl ${
        scrolled 
          ? "bg-[#0d1117]/60 backdrop-blur-md border border-[#30363d]/80 shadow-[0_8px_30px_rgba(0,0,0,0.4)]" 
          : "bg-[#0d1117]/40 backdrop-blur-sm border border-[#30363d]/40"
      } text-[#c9d1d9] px-6 py-3.5 flex items-center justify-between`}
    >
      <div className="flex items-center space-x-6">
        
        {inWorkspace ? (
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="flex items-center justify-center p-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white transition-all duration-300 border border-[#30363d] hover:border-[#8b949e]/50 shadow-sm"
              title="Back to Dashboard"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="w-[1px] h-6 bg-[#30363d]/50"></div>
            <span className="flex items-center space-x-2 text-white">
              <span className="font-bold text-xl tracking-tight">RepoLens</span>
            </span>
          </div>
        ) : (
          <Link href="/" className="flex items-center space-x-2 text-white group">
            <div className="p-1.5 rounded-lg bg-[#21262d] border border-[#30363d] group-hover:border-[#58a6ff]/50 transition-colors shadow-inner">
               <Terminal size={22} className="text-[#c9d1d9] group-hover:text-[#58a6ff] transition-colors" />
            </div>
            <span className="font-bold text-xl tracking-tight">RepoLens</span>
          </Link>
        )}

        <div className="hidden md:flex space-x-2">
          <Link href="/about" className="text-sm font-medium text-[#c9d1d9] hover:text-white hover:bg-[#21262d] px-3 py-1.5 rounded-md transition-all duration-300 relative group overflow-hidden">
            <span className="relative z-10">About</span>
            <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-[#c9d1d9] transition-all duration-300 group-hover:w-full"></div>
          </Link>
          <Link href="/contact" className="text-sm font-medium text-[#c9d1d9] hover:text-white hover:bg-[#21262d] px-3 py-1.5 rounded-md transition-all duration-300 relative group overflow-hidden">
            <span className="relative z-10">Contact Us</span>
            <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-[#c9d1d9] transition-all duration-300 group-hover:w-full"></div>
          </Link>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {isAuthenticated ? (
          <>
            <Link 
              href="/dashboard" 
              className="text-sm font-medium hover:text-white text-[#c9d1d9] hover:bg-[#21262d] px-3 py-1.5 rounded-md transition-all duration-300"
            >
              Dashboard
            </Link>
            <button 
              onClick={handleLogout}
              className="text-sm text-[#f85149] hover:text-white hover:bg-[#da3633] hover:border-[#da3633] transition-all duration-300 font-medium bg-[#21262d] border border-[#30363d] px-4 py-1.5 rounded-lg shadow-sm"
            >
              Logout
            </button>
          </>
        ) : (
          <Link 
            href="/login" 
            className="text-sm font-semibold bg-[#238636] hover:bg-[#2ea043] text-white px-5 py-2 rounded-lg border border-[rgba(240,246,252,0.1)] transition-all duration-300 shadow-[0_0_15px_rgba(35,134,54,0.2)] hover:shadow-[0_0_20px_rgba(46,160,67,0.4)] block"
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}

import Link from "next/link";
import { CheckCircle, Blocks, Workflow, Search, TerminalSquare, Eye, Fingerprint, Cpu, Zap, Activity } from "lucide-react";
import Footer from "@/components/layout/Footer";

export default function AboutPage() {
  return (
    <div className="flex flex-col flex-grow w-full overflow-hidden bg-[#0d1117] text-[#c9d1d9] pb-32 selection:bg-[#58a6ff] selection:text-white relative">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-screen" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}></div>

      {/* Header Section */}
      <section className="relative w-full px-6 pt-32 pb-24 border-b border-[#30363d]/80 bg-gradient-to-b from-[#0d1117] via-[#161b22]/50 to-[#0d1117] flex flex-col justify-center items-center overflow-hidden">
        <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] min-w-[300px] min-h-[300px] bg-[#58a6ff] opacity-[0.05] blur-[150px] rounded-full pointer-events-none animate-pulse-slow"></div>
        <div className="absolute right-[10%] bottom-[10%] w-[30vw] h-[30vw] min-w-[300px] min-h-[300px] bg-[#a371f7] opacity-[0.05] blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-4xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#21262d] border border-[#30363d] text-xs font-semibold text-[#8b949e] mb-8 shadow-sm group hover:border-[#a371f7]/50 hover:text-[#c9d1d9] transition-all cursor-crosshair">
             <Fingerprint size={14} className="text-[#a371f7] group-hover:scale-110 transition-transform" />
             Enterprise System Documentation
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter drop-shadow-md pb-2">
            Comprehensive <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#58a6ff] via-[#79c0ff] to-[#a371f7]">Codebase Telemetry</span>
          </h1>
          <p className="max-w-3xl mx-auto text-xl text-[#8b949e] leading-relaxed font-light mt-6">
            RepoLens Technologies Pvt. Ltd. architects precision tools for indexing, embedding, and visualizing the entire structural hierarchy of complex monolithic and microservice repositories.
          </p>
        </div>
      </section>

      {/* Technical Architecture Deep Dive */}
      <section className="max-w-6xl w-full mx-auto px-6 py-32 relative">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 text-[#e3b341] font-mono text-sm tracking-widest font-semibold mb-6">
             <Cpu size={16} /> INTERNAL_ENGINE
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Under The Hood</h2>
          <p className="text-[#8b949e] max-w-2xl mx-auto font-light text-xl">
            We don't just grep files. Our telemetry engine leverages advanced AST generation, embedded vector models, and intelligent visual mapping algorithms.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div className="space-y-10 pl-4 border-l-2 border-[#30363d]/50 bg-gradient-to-b from-transparent via-[#30363d]/10 to-transparent pb-8 pt-8">
             <div className="group relative -ml-[25px] flex items-start gap-6">
               <div className="absolute top-5 -left-1 w-2 h-2 rounded-full bg-[#58a6ff] group-hover:scale-150 transition-transform"></div>
               <div className="w-16 h-16 rounded-2xl bg-[#161b22] border border-[#30363d] flex-shrink-0 flex items-center justify-center group-hover:bg-[#58a6ff]/10 group-hover:border-[#58a6ff]/50 transition-all duration-300 shadow-lg">
                 <Blocks className="w-8 h-8 text-[#58a6ff] group-hover:scale-110 transition-transform duration-300" />
               </div>
               <div>
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[#58a6ff] transition-colors">Language-Agnostic Tree Parsing</h3>
                  <p className="text-base text-[#8b949e] leading-relaxed font-light">
                    Once a repository is ingested, our backend pipeline dynamically spawns AST parsers tailored to the detected language frameworks (React, Python FastAPI, Go, etc.). It shreds files into their discrete functional nodes, tracking precise start and end lines.
                  </p>
               </div>
             </div>

             <div className="group relative -ml-[25px] flex items-start gap-6">
               <div className="absolute top-5 -left-1 w-2 h-2 rounded-full bg-[#a371f7] group-hover:scale-150 transition-transform"></div>
               <div className="w-16 h-16 rounded-2xl bg-[#161b22] border border-[#30363d] flex-shrink-0 flex items-center justify-center group-hover:bg-[#a371f7]/10 group-hover:border-[#a371f7]/50 transition-all duration-300 shadow-lg">
                 <Search className="w-8 h-8 text-[#a371f7] group-hover:scale-110 transition-transform duration-300" />
               </div>
               <div>
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[#a371f7] transition-colors">Vector Embedding Store</h3>
                  <p className="text-base text-[#8b949e] leading-relaxed font-light">
                    By feeding extracted logic through latest models, we map thousands of semantic vectors into pinecone indices. This unlocks the ability to query complex logic patterns independent of explicit keyword presence.
                  </p>
               </div>
             </div>

             <div className="group relative -ml-[25px] flex items-start gap-6">
               <div className="absolute top-5 -left-1 w-2 h-2 rounded-full bg-[#2ea043] group-hover:scale-150 transition-transform"></div>
               <div className="w-16 h-16 rounded-2xl bg-[#161b22] border border-[#30363d] flex-shrink-0 flex items-center justify-center group-hover:bg-[#2ea043]/10 group-hover:border-[#2ea043]/50 transition-all duration-300 shadow-lg">
                 <Workflow className="w-8 h-8 text-[#2ea043] group-hover:scale-110 transition-transform duration-300" />
               </div>
               <div>
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[#2ea043] transition-colors">Force-Directed Visual Mapping</h3>
                  <p className="text-base text-[#8b949e] leading-relaxed font-light">
                    RepoLens translates your directory structure and file dependencies into an interactive stellar map. Hover physics directly interface with Monaco Editor contexts via a localized Editor engine.
                  </p>
               </div>
             </div>
          </div>

          <div className="bg-[#010409] border border-[#30363d]/80 rounded-3xl p-8 shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-tr from-[#58a6ff]/5 to-[#a371f7]/10 opacity-[0.1] group-hover:opacity-[0.2] transition-opacity duration-700"></div>
             <div className="flex items-center gap-3 mb-6 px-2">
                <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f56]"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-[#27c93f]"></div>
                <span className="text-xs font-mono text-[#8b949e] ml-4 bg-[#161b22] px-3 py-1 rounded-md border border-[#30363d]/50">architecture.md</span>
             </div>
             <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#30363d] to-transparent mb-6"></div>
             
             <code className="block text-[13px] sm:text-[15px] font-mono text-[#c9d1d9] leading-[1.8] relative z-10 w-full overflow-hidden">
                <span className="text-[#ff7b72] font-semibold">class</span> <span className="text-[#d2a8ff] font-semibold">RepoLensEngine</span> {"{"}<br/>
                &nbsp;&nbsp;<span className="text-[#8b949e] my-1 inline-block">/**<br/>
                &nbsp;&nbsp; * @method InitRAGPipeline<br/>
                &nbsp;&nbsp; * @returns Factual synthesis stream<br/>
                &nbsp;&nbsp; */</span><br/>
                &nbsp;&nbsp;<span className="text-[#ff7b72] font-semibold">async</span> <span className="text-[#d2a8ff] font-semibold">executeQuery</span>(<span className="text-[#a5d6ff]">userPrompt</span>) {"{"}<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#ff7b72] font-semibold">const</span> <span className="text-[#a5d6ff]">vector</span> = <span className="text-[#ff7b72] font-semibold">await</span> <span className="text-[#79c0ff]">embed</span>(userPrompt);<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#ff7b72] font-semibold">const</span> <span className="text-[#a5d6ff]">context</span> = <span className="text-[#79c0ff]">pineconeSearch</span>(vector, <span className="text-[#a5d6ff]">topK</span>=<span className="text-[#79c0ff]">5</span>);<br/><br/>
                
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#ff7b72] font-semibold">return</span> <span className="text-[#d2a8ff]">synthesizeLLM</span>(<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#a5d6ff]">context</span>,<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#a5d6ff]">strictFactualAdherence</span>: <span className="text-[#79c0ff]">true</span><br/>
                &nbsp;&nbsp;&nbsp;&nbsp;);<br/>
                &nbsp;&nbsp;{"}"}<br/>
                {"}"}
             </code>
          </div>

        </div>
      </section>

      {/* Core Values Minimalist Grid */}
      <section className="w-full bg-[#161b22]/50 border-y border-[#30363d]/80 py-32 px-6 relative z-10 backdrop-blur-md">
        <div className="text-center mb-20 max-w-2xl mx-auto">
           <Zap className="w-10 h-10 text-[#e3b341] mx-auto mb-6" />
           <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">Enterprise Promises</h2>
        </div>
        
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
           
           <div className="bg-[#0d1117] p-8 rounded-2xl border border-[#30363d] hover:border-[#58a6ff]/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(88,166,255,0.1)] group">
              <CheckCircle className="w-10 h-10 text-[#58a6ff] mb-6 group-hover:scale-110 transition-transform" />
              <h4 className="text-white font-bold text-xl mb-3">Zero Retention Model</h4>
              <p className="text-[#8b949e] text-[15px] leading-relaxed">LLMs only process explicit chunks retrieved via RAG. Code is never logged for foundational training.</p>
           </div>
           
           <div className="bg-[#0d1117] p-8 rounded-2xl border border-[#30363d] hover:border-[#a371f7]/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(163,113,247,0.1)] group">
              <Eye className="w-10 h-10 text-[#a371f7] mb-6 group-hover:scale-110 transition-transform" />
              <h4 className="text-white font-bold text-xl mb-3">Holistic Visibility</h4>
              <p className="text-[#8b949e] text-[15px] leading-relaxed">Visualize cyclical dependencies immediately with GPU-accelerated massive dynamic architectures.</p>
           </div>
           
           <div className="bg-[#0d1117] p-8 rounded-2xl border border-[#30363d] hover:border-[#2ea043]/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(46,160,67,0.1)] group">
              <TerminalSquare className="w-10 h-10 text-[#2ea043] mb-6 group-hover:scale-110 transition-transform" />
              <h4 className="text-white font-bold text-xl mb-3">Native Editor Bounds</h4>
              <p className="text-[#8b949e] text-[15px] leading-relaxed">Browser editors map directly to retrieved AST lines, scrolling immediately to exact target queries.</p>
           </div>
           
           <div className="bg-[#0d1117] p-8 rounded-2xl border border-[#30363d] hover:border-[#e3b341]/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(227,179,65,0.1)] group">
              <Activity className="w-10 h-10 text-[#e3b341] mb-6 group-hover:scale-110 transition-transform" />
              <h4 className="text-white font-bold text-xl mb-3">Sub-200ms Search</h4>
              <p className="text-[#8b949e] text-[15px] leading-relaxed">Aggressively optimized indexing structures meant to serve enterprise questions faster than generic agents.</p>
           </div>

        </div>
      </section>
            <Footer />

    </div>
  );
}

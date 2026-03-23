import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-grow items-center justify-center -mt-16 text-center px-4">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-500">
          Understand your code. <br />
          <span className="text-white">Faster than ever.</span>
        </h1>
        <p className="text-xl text-[#8b949e] mb-10 max-w-2xl mx-auto leading-relaxed">
          RepoLens uses advanced AI to index your repositories. Ask questions, get context-aware explanations, and dive deep into any codebase without opening an IDE.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link 
            href="/dashboard" 
            className="flex items-center justify-center px-8 py-3.5 text-lg font-semibold rounded-full bg-[#238636] hover:bg-[#2ea043] text-white border border-[rgba(240,246,252,0.1)] transition w-full sm:w-auto shadow-md hover:shadow-lg"
          >
            Get Started
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <Link 
            href="/about" 
            className="flex items-center justify-center px-8 py-3.5 text-lg font-semibold rounded-full bg-[#21262d] hover:bg-[var(--color-gh-border)] text-[#c9d1d9] border border-[var(--color-gh-border)] transition w-full sm:w-auto shadow-sm hover:shadow-md"
          >
            Learn More
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-8 rounded-2xl bg-[#161b22] border border-[var(--color-gh-border)] shadow-md hover:border-[#58a6ff]/50 transition duration-300">
            <div className="w-12 h-12 rounded-xl bg-[#1f242c] flex items-center justify-center mb-5 border border-[var(--color-gh-border)] shadow-inner">
              <svg className="w-6 h-6 text-[#58a6ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Clone & Index</h3>
            <p className="text-sm text-[#8b949e] leading-relaxed">Easily pull any repository and let our engine index the codebase into a vector database for semantic search.</p>
          </div>

          <div className="p-8 rounded-2xl bg-[#161b22] border border-[var(--color-gh-border)] shadow-md hover:border-[#2ea043]/50 transition duration-300">
            <div className="w-12 h-12 rounded-xl bg-[#1f242c] flex items-center justify-center mb-5 border border-[var(--color-gh-border)] shadow-inner">
              <svg className="w-6 h-6 text-[#2ea043]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Chat Contextually</h3>
            <p className="text-sm text-[#8b949e] leading-relaxed">Ask specific questions about logic, functions, or UI components. Get accurate answers referencing exact lines of code.</p>
          </div>

          <div className="p-8 rounded-2xl bg-[#161b22] border border-[var(--color-gh-border)] shadow-md hover:border-[#a371f7]/50 transition duration-300">
            <div className="w-12 h-12 rounded-xl bg-[#1f242c] flex items-center justify-center mb-5 border border-[var(--color-gh-border)] shadow-inner">
              <svg className="w-6 h-6 text-[#a371f7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Instant Understanding</h3>
            <p className="text-sm text-[#8b949e] leading-relaxed">Slash onboarding time. Instead of reading thousands of lines of documentation, directly interact with the code.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
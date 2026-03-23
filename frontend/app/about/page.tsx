import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6">
      <h1 className="text-4xl font-bold mb-8 pb-4 border-b border-[var(--color-gh-border)] text-white">
        About <span className="text-[#58a6ff]">RepoLens</span>
      </h1>
      
      <div className="space-y-8 text-lg text-[#c9d1d9] leading-relaxed">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">Our Mission</h2>
          <p>
            At RepoLens, our mission is to dramatically reduce the time it takes for developers to understand complex codebases. 
            We believe that reading code shouldn't feel like deciphering an ancient language without a dictionary. 
            By leveraging advanced AI models and sophisticated codebase indexing, we allow you to "chat" directly with your repositories.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-white">How It Works</h2>
          <ol className="list-decimal pl-6 space-y-4">
            <li>
              <strong className="text-white">Clone & Index:</strong> You provide a GitHub repository URL. Our backend securely clones the repository and extracts all relevant code files.
            </li>
            <li>
              <strong className="text-white">Smart Parsing:</strong> We break down the code into semantic chunks (functions, classes, components) ensuring that context is preserved.
            </li>
            <li>
              <strong className="text-white">Vector Embeddings:</strong> Using state-of-the-art LLMs, we generate high-dimensional vector embeddings of your codebase, allowing for lightning-fast semantic search.
            </li>
            <li>
              <strong className="text-white">Chat Contextually:</strong> You ask questions. We find the most relevant code snippets and provide comprehensive, cited answers.
            </li>
          </ol>
        </section>

        <section className="bg-[#161b22] p-8 rounded-2xl border border-[var(--color-gh-border)] mt-12 text-center shadow-lg">
          <h2 className="text-xl font-semibold mb-3 text-white">Ready to explore your code?</h2>
          <Link 
            href="/dashboard"
            className="inline-block mt-4 px-8 py-3 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-white font-medium transition shadow-md hover:shadow-lg"
          >
            Go to Dashboard
          </Link>
        </section>
      </div>
    </div>
  );
}

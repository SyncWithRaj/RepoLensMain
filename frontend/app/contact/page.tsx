"use client";

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto py-16 px-6">
      <h1 className="text-4xl font-bold mb-8 pb-4 border-b border-[var(--color-gh-border)] text-white">
        Contact Us
      </h1>
      
      <p className="text-[#8b949e] mb-8 text-lg">
        Have questions about RepoLens, feature requests, or encountered a bug? We'd love to hear from you. 
        Fill out the form below and our team will get back to you shortly.
      </p>

      <form className="bg-[#161b22] p-8 rounded-2xl border border-[var(--color-gh-border)] space-y-6 shadow-lg">
        <div>
          <label className="block text-sm font-medium text-[#c9d1d9] mb-2">Name</label>
          <input 
            type="text" 
            placeholder="octocat"
            className="w-full bg-[#010409] border border-[var(--color-gh-border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition shadow-inner"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#c9d1d9] mb-2">Email Address</label>
          <input 
            type="email" 
            placeholder="octocat@github.com"
            className="w-full bg-[#010409] border border-[var(--color-gh-border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition shadow-inner"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#c9d1d9] mb-2">Message</label>
          <textarea 
            rows={5}
            placeholder="How can we help you?"
            className="w-full bg-[#010409] border border-[var(--color-gh-border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition resize-y shadow-inner"
          ></textarea>
        </div>

        <div className="flex justify-end pt-2">
          <button 
            type="button"
            className="px-8 py-3 rounded-xl bg-[#238636] hover:bg-[#2ea043] font-medium text-white transition shadow-md hover:shadow-lg"
            onClick={() => alert("This is a demo UI. Messaging is currently disabled.")}
          >
            Send Message
          </button>
        </div>
      </form>

      <div className="mt-12 text-center text-[#8b949e] text-sm">
        <p>Alternatively, you can reach us on Twitter at <a href="#" className="text-[#58a6ff] hover:underline">@repolens</a>.</p>
      </div>
    </div>
  );
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import {
  SignInButton,
  SignOutButton,
  GetStartedButton,
} from "@/app/components/ClientButtons";
import { LogoWithText } from "@/app/components/Logo";

export default async function Home() {
  const session = await getServerSession(authOptions);

  const isLoggedIn = !!session;

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 overflow-hidden selection:bg-violet-500/30 selection:text-white">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-violet-900/15 via-cyan-900/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-[800px] -left-20 w-[400px] h-[400px] rounded-full bg-violet-600/5 blur-3xl pointer-events-none" />
      <div className="absolute top-[1200px] -right-20 w-[500px] h-[500px] rounded-full bg-cyan-600/5 blur-3xl pointer-events-none" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293706_1px,transparent_1px),linear-gradient(to_bottom,#1f293706_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-zinc-950/70 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <LogoWithText />

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <Link
              href="#features"
              className="hover:text-white transition-colors"
            >
              Features
            </Link>
            <Link
              href="/upload"
              className="hover:text-white transition-colors text-violet-400 font-semibold"
            >
              Upload Docs
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {isLoggedIn && (
              <Link
                href="/upload"
                className="hidden sm:inline-flex h-9 items-center justify-center rounded-lg bg-violet-600 px-4 text-xs font-semibold text-white hover:bg-violet-500 transition-colors shadow-md shadow-violet-600/10"
              >
                Upload Docs
              </Link>
            )}
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-medium text-white">
                    {session.user?.name || "User"}
                  </span>
                  <span className="text-[10px] text-zinc-400 max-w-[140px] truncate">
                    {session.user?.email}
                  </span>
                </div>
                {session.user?.image ? (
                  <div className="relative h-8 w-8 overflow-hidden rounded-full ring-1 ring-white/20">
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "User Avatar"}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center font-bold text-xs text-white">
                    {session.user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <div className="h-4 w-px bg-zinc-800" />
                <SignOutButton />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <SignInButton />
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-20 relative z-10 flex flex-col items-center">
        <section className="text-center max-w-3xl flex flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/5 px-3 py-1 text-xs font-semibold text-violet-400 mb-8 backdrop-blur-sm animate-pulse">
            <span className="flex h-1.5 w-1.5 rounded-full bg-violet-400" />
            Integrate Google & Database Auth - Online
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white">
            The Intelligent Brain for Your Team's{" "}
            <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              Knowledge Base
            </span>
          </h1>

          <p className="mt-6 text-lg leading-8 text-zinc-400">
            Sync Notion, Google Drive, databases, or documents. Upload manuals
            and chat with your files in real-time. Instantly find sources, build
            summaries, and unlock insights.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            <GetStartedButton isLoggedIn={isLoggedIn} />
            <Link
              href="#preview"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 px-6 font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900 transition-all"
            >
              Watch Workspace Demo
            </Link>
          </div>
        </section>

        <section
          id="preview"
          className="mt-20 w-full max-w-5xl rounded-2xl border border-white/10 bg-zinc-900/40 p-4 shadow-2xl backdrop-blur-md relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/20 to-zinc-950 pointer-events-none" />

          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500/40" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/40" />
              <span className="h-3 w-3 rounded-full bg-green-500/40" />
            </div>
            <div className="rounded-lg bg-zinc-950/80 px-4 py-1 text-[11px] text-zinc-500 border border-white/5 font-mono">
              ai-assistant.intelligence/workspace
            </div>
            <div className="w-12" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-h-[420px]">
            <div className="border border-white/5 rounded-xl bg-zinc-950/50 p-4 flex flex-col gap-4 text-xs">
              <div className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
                Sources Indexed
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900 border border-white/5 text-white">
                  <svg
                    className="w-4 h-4 text-violet-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="truncate">Product_Specs.pdf</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40 transition-colors">
                  <svg
                    className="w-4 h-4 text-cyan-500 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13"
                    />
                  </svg>
                  <span className="truncate">Knowledge_Base.docx</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40 transition-colors">
                  <svg
                    className="w-4 h-4 text-green-500 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                    />
                  </svg>
                  <span className="truncate">Postgres_Neondb (Sync)</span>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-white/5 flex flex-col gap-2">
                <div className="flex justify-between items-center text-[10px] text-zinc-500">
                  <span>Indexing Speed</span>
                  <span className="text-cyan-400 font-mono">1.2 MB/s</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full w-4/5 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full" />
                </div>
              </div>
            </div>

            {/* Chat Pane Mockup */}
            <div className="md:col-span-3 border border-white/5 rounded-xl bg-zinc-950/30 p-4 flex flex-col justify-between">
              <div className="space-y-4">
                {/* User message */}
                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs text-white">
                    M
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="text-xs text-zinc-400 font-medium">
                      User
                    </div>
                    <div className="text-sm text-zinc-200 bg-zinc-900/80 p-3 rounded-xl inline-block border border-white/5">
                      How does the user session schema work with Google
                      authentication in our DB?
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center font-bold text-[10px] text-white">
                    AI
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="text-xs text-violet-400 font-medium">
                      Assistant
                    </div>
                    <div className="text-sm text-zinc-300 space-y-2">
                      <p>
                        Based on the{" "}
                        <span className="text-violet-400 font-semibold underline decoration-dashed">
                          prisma/schema.prisma
                        </span>{" "}
                        source, the user authentication session is stored in the{" "}
                        <strong>Session</strong> model, linked to the{" "}
                        <strong>User</strong> table via <code>userId</code>:
                      </p>
                      <pre className="text-xs bg-zinc-950/80 border border-white/5 p-3 rounded-lg font-mono text-cyan-300 overflow-x-auto">
                        {`model Session {
                          sessionToken String   @unique
                          userId       String
                          expires      DateTime
                          user         User     @relation(fields: [userId]...)
                        }`}
                      </pre>
                    </div>

                    {/* Sources Citations */}
                    <div className="pt-2 flex flex-wrap gap-2 items-center">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                        Sources:
                      </span>
                      <span className="inline-flex items-center gap-1 rounded bg-zinc-900 border border-white/10 px-2 py-0.5 text-[10px] text-zinc-300 font-mono">
                        schema.prisma:L46-54
                      </span>
                      <span className="inline-flex items-center gap-1 rounded bg-zinc-900 border border-white/10 px-2 py-0.5 text-[10px] text-zinc-300 font-mono">
                        auth.ts:L16-24
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <input
                  type="text"
                  placeholder="Ask any question about your documents..."
                  disabled
                  className="flex-1 rounded-xl border border-white/5 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none"
                />
                <button
                  disabled
                  className="rounded-xl bg-violet-600 px-4 text-white opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 w-full">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Engineered for absolute accuracy
            </h2>
            <p className="mt-4 text-zinc-400">
              Discover premium AI tools that handle your proprietary knowledge
              safely and precisely.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-white/5 bg-zinc-900/20 p-8 shadow-xl backdrop-blur-sm hover:border-violet-500/20 hover:bg-zinc-900/30 transition-all group">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-violet-500/10 p-2 text-violet-400 mb-6 group-hover:scale-110 transition-transform">
                <svg
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  className="w-full h-full"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">
                Semantic AI Search
              </h3>
              <p className="mt-3 text-sm text-zinc-400 leading-6">
                Understands context and intent. Finds documents even if they
                don't match the exact words in your query.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-white/5 bg-zinc-900/20 p-8 shadow-xl backdrop-blur-sm hover:border-indigo-500/20 hover:bg-zinc-900/30 transition-all group">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-500/10 p-2 text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <svg
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  className="w-full h-full"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">
                Continuous Syncing
              </h3>
              <p className="mt-3 text-sm text-zinc-400 leading-6">
                Connect Neon, Google Docs, Notion, or local folders. Any
                modifications are automatically re-indexed within seconds.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-white/5 bg-zinc-900/20 p-8 shadow-xl backdrop-blur-sm hover:border-cyan-500/20 hover:bg-zinc-900/30 transition-all group">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-cyan-500/10 p-2 text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
                <svg
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  className="w-full h-full"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">
                Verifiable Sources
              </h3>
              <p className="mt-3 text-sm text-zinc-400 leading-6">
                Every generated response features exact line citations
                referencing the root document. Absolutely zero hallucinated
                answers.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 bg-zinc-950 py-8 relative z-10 text-center">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-400">
              AI Knowledge Base Assistant
            </span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-zinc-300">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-zinc-300">
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-zinc-300">
              System Status
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

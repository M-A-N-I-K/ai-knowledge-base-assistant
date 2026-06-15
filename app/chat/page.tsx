"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import Image from "next/image";
import { Logo } from "@/app/components/Logo";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: Array<{ name: string; location: string }>;
}

interface ChatSession {
  id: string;
  title: string;
  active: boolean;
}

export default function ChatPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [indexWorkspace, setIndexWorkspace] = useState("main-kb");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock chat list sidebar
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([
    { id: "1", title: "Prisma Connection Pool query", active: true },
    { id: "2", title: "User session auth schema", active: false },
    { id: "3", title: "Neon DB serverless adapter", active: false },
  ]);

  // Mock active sources
  const activeSources = [
    { name: "schema.prisma", type: "prisma", size: "1.8 KB" },
    { name: "prisma.ts", type: "ts", size: "371 Bytes" },
    { name: "auth.ts", type: "ts", size: "241 Bytes" },
  ];

  // Suggestion card prompts
  const suggestions = [
    {
      title: "Explain user schema",
      desc: "Retrieve fields and relationships of User model",
      prompt: "Explain the user model details from schema.prisma",
    },
    {
      title: "Setup Neon adapter",
      desc: "How database connections are configured in Prisma 7",
      prompt: "How do I configure database adapters for Neon?",
    },
    {
      title: "Google OAuth flows",
      desc: "Verify session redirects and provider setups",
      prompt: "How do google authentication redirects work in this app?",
    },
  ];

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, isSearching]);

  // Handle standard questions response mapping
  const getMockAnswer = (
    query: string,
  ): {
    content: string;
    sources: Array<{ name: string; location: string }>;
  } => {
    const q = query.toLowerCase();
    if (
      q.includes("user model") ||
      q.includes("user schema") ||
      q.includes("schema.prisma")
    ) {
      return {
        content: `Based on your **schema.prisma** file, the \`User\` model defines the core attributes for users in the database.

It contains the following fields:
*   \`id\` (String, primary key, defaulted with cuid)
*   \`name\` (Optional string)
*   \`email\` (Unique string, used for login)
*   \`emailVerified\` (Optional DateTime timestamp for validation)
*   \`image\` (Optional string storing the avatar URL)
*   \`createdAt\` (DateTime, auto-filled on insertion)
*   \`updatedAt\` (DateTime, auto-updated on edit)

Additionally, it lists these relational properties:
*   \`accounts\`: One-to-many relationship with the \`Account\` model.
*   \`sessions\`: One-to-many relationship with the \`Session\` model.
*   \`Authenticator\`: One-to-many relationship with the \`Authenticator\` model (WebAuthn support).`,
        sources: [
          { name: "schema.prisma", location: "L10-23" },
          { name: "schema.prisma", location: "L46-54" },
        ],
      };
    } else if (
      q.includes("neon") ||
      q.includes("adapter") ||
      q.includes("prisma.ts")
    ) {
      return {
        content: `To configure the Neon PostgreSQL database adapter under **Prisma 7**, the project instantiates the query engine in \`lib/prisma.ts\` using serverless connections:

1.  **WebSocket Setup**: The \`neonConfig.webSocketConstructor\` is mapped to the standard Node \`ws\` module:
    \`\`\`typescript
    import { neonConfig } from "@neondatabase/serverless";
    import ws from "ws";
    neonConfig.webSocketConstructor = ws;
    \`\`\`
2.  **Adapter Initialization**: The \`PrismaNeon\` adapter connects using the \`DATABASE_URL\` environmental variable:
    \`\`\`typescript
    const adapter = new PrismaNeon({ connectionString });
    \`\`\`
3.  **Client Constructor**: Finally, the adapter is supplied directly to the constructor option \`new PrismaClient({ adapter })\`. This bypasses the deprecated Rust query engine binary and connects over WebSockets.`,
        sources: [
          { name: "prisma.ts", location: "L1-15" },
          { name: "schema.prisma", location: "L1-6" },
        ],
      };
    } else if (
      q.includes("google") ||
      q.includes("auth") ||
      q.includes("redirect")
    ) {
      return {
        content: `Google OAuth flows are integrated using **NextAuth v4**.

Here is the operational breakdown:
*   **Provider Configuration**: Configured in \`lib/auth.ts\` inside \`GoogleProvider({ clientId, clientSecret })\`. It loads credentials from \`.env\`.
*   **Redirect Callbacks**: Secure session tokens are mapped in the \`session\` callback inside \`lib/auth.ts\`, binding the database \`user.id\` directly to the active client session token.
*   **Custom Login Redirect**: Clicking "Continue with Google" in the custom \`/auth/signin\` screen triggers \`signIn("google", { callbackUrl: "/" })\`, directing users to the Google consent screen and returning them to the homepage upon success.`,
        sources: [
          { name: "auth.ts", location: "L6-26" },
          { name: "signin/page.tsx", location: "L13-21" },
        ],
      };
    } else {
      return {
        content: `I've analyzed your indexed knowledge base files (including **schema.prisma**, **prisma.ts**, and **auth.ts**).

Regarding your query: "${query}"

Here is what I found:
This project is built using Next.js 16 (App Router), Prisma 7, and NextAuth v4. All files are successfully parsed into vectors and synced with Neon Serverless PostgreSQL.

Let me know if you need specific code examples or details about these configurations!`,
        sources: [
          { name: "schema.prisma", location: "L1-12" },
          { name: "prisma.ts", location: "L1-10" },
        ],
      };
    }
  };

  // Simulates character-by-character message streaming
  const streamResponse = (
    text: string,
    sources: Array<{ name: string; location: string }>,
  ) => {
    setIsTyping(true);
    let currentText = "";
    let i = 0;
    const speed = 15; // ms per character

    const interval = setInterval(() => {
      currentText += text.charAt(i);
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === "assistant") {
          return [...prev.slice(0, -1), { ...lastMsg, content: currentText }];
        } else {
          return [
            ...prev,
            {
              id: Math.random().toString(36).substring(7),
              role: "assistant",
              content: currentText,
              timestamp: new Date(),
              sources,
            },
          ];
        }
      });
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, speed);
  };

  // Submit message
  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSearching(true);

    // Simulate vector/embeddings search latency
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSearching(false);

    // Get response and start streaming
    const answer = getMockAnswer(textToSend);
    streamResponse(answer.content, answer.sources);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  return (
    <div className="relative flex h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293704_1px,transparent_1px),linear-gradient(to_bottom,#1f293704_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />

      <aside className="hidden md:flex flex-col w-64 border-r border-white/5 bg-zinc-950/90 relative z-10">
        <div className="h-16 px-6 border-b border-white/5 flex items-center gap-2.5">
          <Logo iconSize={8} />
          <div className="flex flex-col">
            <span className="font-bold text-sm leading-none text-white">
              AI Assistant
            </span>
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mt-0.5">
              Workspace
            </span>
          </div>
        </div>

        <div className="p-4">
          <button
            onClick={() => setMessages([])}
            className="w-full flex h-10 items-center justify-center gap-2 rounded-xl border border-white/5 bg-zinc-900/50 hover:bg-zinc-900 text-xs font-semibold text-white transition-all shadow-sm active:scale-[0.98]"
          >
            <svg
              className="w-4 h-4 text-violet-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Conversation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          <div className="px-4 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Recent Chats
          </div>
          {chatSessions.map((chat) => (
            <button
              key={chat.id}
              onClick={() => {
                setChatSessions(
                  chatSessions.map((c) => ({ ...c, active: c.id === chat.id })),
                );
                handleSend(`Tell me about ${chat.title}`);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs text-left transition-all ${
                chat.active
                  ? "bg-zinc-900 border border-white/5 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
              }`}
            >
              <svg
                className={`w-4 h-4 ${chat.active ? "text-violet-400" : "text-zinc-600"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span className="truncate flex-1">{chat.title}</span>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-white/5 bg-zinc-950 space-y-3">
          <Link
            href="/upload"
            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Upload More Docs
          </Link>
          <Link
            href="/"
            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-white transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </aside>

      <section className="flex-1 flex flex-col min-w-0 bg-zinc-950/20 relative z-10">
        <header className="h-16 border-b border-white/5 bg-zinc-950/40 backdrop-blur-sm px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <div>
              <h1 className="text-sm font-semibold text-white leading-none">
                AI Knowledge Assistant
              </h1>
              <p className="text-[10px] text-zinc-500 mt-1">
                Sourced from active indexed files
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={indexWorkspace}
              onChange={(e) => setIndexWorkspace(e.target.value)}
              className="rounded-lg border border-white/5 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-violet-500/50 transition-colors"
            >
              <option value="main-kb">Main KB</option>
              <option value="dev-sandbox">Dev Sandbox</option>
            </select>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="max-w-2xl mx-auto h-full flex flex-col justify-center py-12">
              <div className="text-center mb-8">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 p-2.5 text-white shadow-lg shadow-violet-500/20 mb-4 animate-bounce">
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
                      d="M8.684 10.742l-1.922 4.613a1 1 0 001.275 1.275l4.613-1.922c.328-.137.66-.282.977-.442l1.62-1.62a1 1 0 00-1.414-1.414l-1.62 1.62c-.16.317-.305.649-.442.977l-4.613 1.922 1.922-4.613c.137-.328.282-.66.442-.977l1.62-1.62a1 1 0 00-1.414-1.414l-1.62 1.62c-.317.16-.649.305-.977.442z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.828m2.829 2.828L21 21M5.636 5.636a9 9 0 000 12.728m0 0l2.828-2.828"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white">
                  Ask your Knowledge Base
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Start chatting with your documents. Select a suggestion below
                  or write a query.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestions.map((card, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(card.prompt)}
                    className="flex flex-col text-left p-4 rounded-xl border border-white/5 bg-zinc-900/20 hover:bg-zinc-900/40 hover:border-violet-500/20 transition-all group active:scale-[0.98]"
                  >
                    <span className="text-xs font-semibold text-white group-hover:text-violet-400 transition-colors">
                      {card.title}
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-1 leading-normal">
                      {card.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-4 ${msg.role === "user" ? "justify-end" : ""}`}
                >
                  {/* Avatar */}
                  {msg.role === "assistant" && (
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center font-bold text-xs text-white shadow-sm flex-shrink-0">
                      AI
                    </div>
                  )}

                  <div className="flex flex-col max-w-[85%] space-y-1.5">
                    {/* Username/Timestamp */}
                    <div
                      className={`flex items-center gap-2 text-[10px] text-zinc-500 ${msg.role === "user" ? "justify-end" : ""}`}
                    >
                      <span className="font-semibold text-zinc-400">
                        {msg.role === "user"
                          ? session?.user?.name || "User"
                          : "Assistant"}
                      </span>
                      <span>•</span>
                      <span>
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`text-sm leading-relaxed p-4 rounded-2xl border ${
                        msg.role === "user"
                          ? "bg-violet-600/15 border-violet-500/20 text-violet-100 rounded-tr-none"
                          : "bg-zinc-900/60 border-white/5 text-zinc-300 rounded-tl-none"
                      }`}
                    >
                      <div className="space-y-2 whitespace-pre-line">
                        {msg.content}
                      </div>
                    </div>

                    {msg.role === "assistant" &&
                      msg.sources &&
                      msg.sources.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-1.5 pl-1">
                          <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">
                            Citations:
                          </span>
                          {msg.sources.map((src, sIdx) => (
                            <div
                              key={sIdx}
                              className="inline-flex items-center gap-1 rounded bg-zinc-900 border border-white/5 hover:border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400 hover:text-white font-mono cursor-help transition-all"
                              title={`Referenced from ${src.name} at line range ${src.location}`}
                            >
                              <svg
                                className="w-3 h-3 text-violet-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              <span>
                                {src.name}:{src.location}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>

                  {msg.role === "user" && (
                    <div className="flex-shrink-0">
                      {session?.user?.image ? (
                        <div className="relative h-8 w-8 overflow-hidden rounded-lg ring-1 ring-white/10">
                          <Image
                            src={session.user.image}
                            alt={session.user.name || "User"}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-300 border border-white/5">
                          {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {isSearching && (
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-400 flex-shrink-0 border border-white/5 animate-pulse">
                    AI
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <div className="text-[10px] text-zinc-500">
                      Searching vector database...
                    </div>
                    <div className="flex items-center gap-1 bg-zinc-900/40 border border-white/5 p-4 rounded-2xl rounded-tl-none text-xs text-zinc-500">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                      </span>
                      Scanning indices... Matching cosine similarity...
                    </div>
                  </div>
                </div>
              )}

              {isTyping && !isSearching && (
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center font-bold text-xs text-violet-400 flex-shrink-0">
                    AI
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <div className="text-[10px] text-zinc-500">
                      Assistant is typing...
                    </div>
                    <div className="bg-zinc-900/60 border border-white/5 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input box bottom */}
        <div className="p-6 border-t border-white/5 bg-zinc-950/20 max-w-3xl w-full mx-auto">
          <div className="relative rounded-2xl border border-white/5 bg-zinc-900/50 p-2 focus-within:border-violet-500/40 transition-colors shadow-lg backdrop-blur-sm">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSearching || isTyping}
              placeholder="Ask any question about your database..."
              rows={2}
              className="w-full resize-none bg-transparent px-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none disabled:opacity-50"
            />
            <div className="flex items-center justify-between border-t border-white/5 pt-2 px-2 mt-1">
              <div className="flex gap-2">
                <button
                  type="button"
                  title="Source select"
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                </button>
              </div>

              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isSearching || isTyping}
                className="inline-flex h-8 items-center justify-center rounded-lg bg-violet-600 px-4 text-xs font-semibold text-white hover:bg-violet-500 shadow-md shadow-violet-600/10 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-[0.97]"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Right Sidebar: Active Files Indexed */}
      <aside className="hidden lg:flex flex-col w-64 border-l border-white/5 bg-zinc-950/40 relative z-10 p-6 space-y-6">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <svg
              className="w-4 h-4 text-violet-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Sources Vectorized
          </h3>
          <div className="space-y-2">
            {activeSources.map((src, sIdx) => (
              <div
                key={sIdx}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-zinc-900/10 p-3 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-300 truncate">
                    {src.name}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{src.size}</p>
                </div>
                <span
                  className="h-2 w-2 rounded-full bg-green-500"
                  title="Active Index"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/5 pt-4 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-500">Vector Index Size</span>
            <span className="font-mono text-cyan-400 font-semibold">
              1,240 chunks
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-500">Similarity Metric</span>
            <span className="font-mono text-zinc-400">Cosine Distance</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-500">Embedding model</span>
            <span className="font-mono text-zinc-400">text-embedding-004</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

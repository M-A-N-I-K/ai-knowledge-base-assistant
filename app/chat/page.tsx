"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import Image from "next/image";
import { Logo } from "@/app/components/Logo";
import {
  getEmbeddedSources,
  generateSuggestions,
  getChatSessions,
  createChatSession,
  askKnowledgeBase,
} from "@/app/actions/chat";
import type {
  Source,
  Suggestion,
  ChatSessionSummary,
} from "@/app/actions/chat";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: Array<{ name: string; location: string }>;
}

interface ActiveSession extends ChatSessionSummary {
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

  const [chatSessions, setChatSessions] = useState<ActiveSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Load sources, suggestions, and sessions on mount
  useEffect(() => {
    async function loadInitialData() {
      setIsLoadingData(true);
      try {
        const [embeddedSources, sessions] = await Promise.all([
          getEmbeddedSources(),
          getChatSessions(),
        ]);
        setSources(embeddedSources);
        setChatSessions(sessions.map((s, i) => ({ ...s, active: i === 0 })));

        // const generatedSuggestions = await generateSuggestions(
        //   embeddedSources.map((s) => s.name)
        // );
        // setSuggestions(generatedSuggestions);
      } finally {
        setIsLoadingData(false);
      }
    }
    loadInitialData();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, isSearching]);

  // Stream real content character by character for smooth UX
  const streamResponse = (
    text: string,
    msgSources: Array<{ name: string; location: string }>,
  ) => {
    setIsTyping(true);
    let i = 0;
    let currentText = "";

    const interval = setInterval(() => {
      currentText += text.charAt(i);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return [...prev.slice(0, -1), { ...last, content: currentText }];
        }
        return [
          ...prev,
          {
            id: Math.random().toString(36).substring(7),
            role: "assistant",
            content: currentText,
            timestamp: new Date(),
            sources: msgSources,
          },
        ];
      });
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 12);
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        role: "user",
        content: textToSend,
        timestamp: new Date(),
      },
    ]);
    setInput("");
    setIsSearching(true);

    // Create a session on the first message of a new conversation
    let sessionId = currentSessionId;
    if (!sessionId) {
      const created = await createChatSession(textToSend);
      sessionId = created.id;
      setCurrentSessionId(sessionId);
      const newSession: ActiveSession = {
        id: sessionId,
        title: textToSend.slice(0, 60),
        createdAt: new Date(),
        active: true,
      };
      setChatSessions((prev) => [
        newSession,
        ...prev.map((s) => ({ ...s, active: false })),
      ]);
    }

    const { content, sources: msgSources } = await askKnowledgeBase(
      textToSend,
      sessionId,
    );

    setIsSearching(false);
    streamResponse(content, msgSources);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setChatSessions((prev) => prev.map((s) => ({ ...s, active: false })));
  };

  const switchSession = (id: string) => {
    setChatSessions((prev) => prev.map((s) => ({ ...s, active: s.id === id })));
    setCurrentSessionId(id);
    setMessages([]);
  };

  const totalChunks = sources.reduce((sum, s) => sum + s.chunks, 0);

  return (
    <div className="relative flex h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293704_1px,transparent_1px),linear-gradient(to_bottom,#1f293704_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />

      {/* Left Sidebar — Chat Sessions */}
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
            onClick={startNewConversation}
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
          {isLoadingData ? (
            <div className="px-4 text-[11px] text-zinc-600 animate-pulse">
              Loading…
            </div>
          ) : chatSessions.length === 0 ? (
            <div className="px-4 text-[11px] text-zinc-600">
              No conversations yet
            </div>
          ) : (
            chatSessions.map((chat) => (
              <button
                key={chat.id}
                onClick={() => switchSession(chat.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs text-left transition-all ${
                  chat.active
                    ? "bg-zinc-900 border border-white/5 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                }`}
              >
                <svg
                  className={`w-4 h-4 flex-shrink-0 ${chat.active ? "text-violet-400" : "text-zinc-600"}`}
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
            ))
          )}
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

      {/* Main Chat Area */}
      <section className="flex-1 flex flex-col min-w-0 bg-zinc-950/20 relative z-10">
        <header className="h-16 border-b border-white/5 bg-zinc-950/40 backdrop-blur-sm px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <div>
              <h1 className="text-sm font-semibold text-white leading-none">
                AI Knowledge Assistant
              </h1>
              <p className="text-[10px] text-zinc-500 mt-1">
                {sources.length > 0
                  ? `${sources.length} source${sources.length !== 1 ? "s" : ""} · ${totalChunks} chunks indexed`
                  : "No documents indexed yet"}
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
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white">
                  Ask your Knowledge Base
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                  {sources.length === 0
                    ? "Upload documents first to start asking questions."
                    : "Start chatting with your documents. Select a suggestion or write a query."}
                </p>
              </div>

              {isLoadingData ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-20 rounded-xl border border-white/5 bg-zinc-900/20 animate-pulse"
                    />
                  ))}
                </div>
              ) : (
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
              )}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-4 ${msg.role === "user" ? "justify-end" : ""}`}
                >
                  {msg.role === "assistant" && (
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center font-bold text-xs text-white shadow-sm flex-shrink-0">
                      AI
                    </div>
                  )}

                  <div className="flex flex-col max-w-[85%] space-y-1.5">
                    <div
                      className={`flex items-center gap-2 text-[10px] text-zinc-500 ${msg.role === "user" ? "justify-end" : ""}`}
                    >
                      <span className="font-semibold text-zinc-400">
                        {msg.role === "user"
                          ? session?.user?.name || "You"
                          : "Assistant"}
                      </span>
                      <span>·</span>
                      <span>
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div
                      className={`text-sm leading-relaxed p-4 rounded-2xl border whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-violet-600/15 border-violet-500/20 text-violet-100 rounded-tr-none"
                          : "bg-zinc-900/60 border-white/5 text-zinc-300 rounded-tl-none"
                      }`}
                    >
                      {msg.content}
                    </div>

                    {msg.role === "assistant" &&
                      msg.sources &&
                      msg.sources.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-1.5 pl-1">
                          <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">
                            Sources:
                          </span>
                          {msg.sources.map((src, sIdx) => (
                            <div
                              key={sIdx}
                              className="inline-flex items-center gap-1 rounded bg-zinc-900 border border-white/5 hover:border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400 hover:text-white font-mono cursor-default transition-all"
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
                              {src.name}
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
                      Searching vector database…
                    </div>
                    <div className="flex items-center gap-1 bg-zinc-900/40 border border-white/5 p-4 rounded-2xl rounded-tl-none text-xs text-zinc-500">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
                      </span>
                      Scanning indices… Matching cosine similarity…
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
                      Assistant is typing…
                    </div>
                    <div className="bg-zinc-900/60 border border-white/5 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
                      {[0, 150, 300].map((delay) => (
                        <span
                          key={delay}
                          className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-6 border-t border-white/5 bg-zinc-950/20 max-w-3xl w-full mx-auto">
          <div className="relative rounded-2xl border border-white/5 bg-zinc-900/50 p-2 focus-within:border-violet-500/40 transition-colors shadow-lg backdrop-blur-sm">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSearching || isTyping}
              placeholder={
                sources.length === 0
                  ? "Upload documents first to start asking questions…"
                  : "Ask any question about your knowledge base…"
              }
              rows={2}
              className="w-full resize-none bg-transparent px-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none disabled:opacity-50"
            />
            <div className="flex items-center justify-end border-t border-white/5 pt-2 px-2 mt-1">
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

      {/* Right Sidebar — Indexed Sources */}
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

          {isLoadingData ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 rounded-xl border border-white/5 bg-zinc-900/10 animate-pulse"
                />
              ))}
            </div>
          ) : sources.length === 0 ? (
            <p className="text-[11px] text-zinc-600 leading-relaxed">
              No documents indexed yet.{" "}
              <Link href="/upload" className="text-violet-400 hover:underline">
                Upload one now.
              </Link>
            </p>
          ) : (
            <div className="space-y-2">
              {sources.map((src, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-zinc-900/10 p-3 text-xs"
                >
                  <div className="min-w-0">
                    <p
                      className="font-semibold text-zinc-300 truncate"
                      title={src.name}
                    >
                      {src.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {src.chunks} chunks
                    </p>
                  </div>
                  <span
                    className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0"
                    title="Indexed"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-white/5 pt-4 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-500">Total Chunks</span>
            <span className="font-mono text-cyan-400 font-semibold">
              {totalChunks.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-500">Similarity Metric</span>
            <span className="font-mono text-zinc-400">Cosine</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-500">Embedding Model</span>
            <span className="font-mono text-zinc-400 text-[10px]">
              gemini-embed-2
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}

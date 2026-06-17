"use client";

import { KeyboardEvent, RefObject } from "react";
import Image from "next/image";
import { Session } from "next-auth";
import { Suggestion, MessageSource } from "../../actions/chat";

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  createdAt?: Date;
  sources?: MessageSource[] | string | null;
}

interface ChatWindowProps {
  messages: ChatMessageData[];
  input: string;
  setInput: (val: string) => void;
  isSearching: boolean;
  isTyping: boolean;
  suggestions: Suggestion[];
  indexWorkspace: string;
  setIndexWorkspace: (val: string) => void;
  userSession: Session | null;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onSend: (text: string) => void;
}

export function ChatWindow({
  messages,
  input,
  setInput,
  isSearching,
  isTyping,
  suggestions,
  indexWorkspace,
  setIndexWorkspace,
  userSession,
  messagesEndRef,
  onSend,
}: ChatWindowProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend(input);
    }
  };

  return (
    <section className="flex-1 flex flex-col min-w-0 bg-zinc-950/20 relative z-10">
      {/* Top bar header */}
      <header className="h-16 border-b border-white/5 bg-zinc-950/40 backdrop-blur-sm px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <div>
            <h1 className="text-xs font-semibold text-white leading-none">AI Knowledge Assistant</h1>
            <p className="text-[9px] text-zinc-500 mt-1">Sourced from active indexed files</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={indexWorkspace}
            onChange={(e) => setIndexWorkspace(e.target.value)}
            className="rounded-lg border border-white/5 bg-zinc-950 px-3 py-1.5 text-[11px] text-zinc-300 focus:outline-none focus:border-violet-500/50 transition-colors"
          >
            <option value="main-kb">Main KB</option>
            <option value="dev-sandbox">Dev Sandbox</option>
          </select>
        </div>
      </header>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          /* Empty state suggestions */
          <div className="max-w-2xl mx-auto h-full flex flex-col justify-center py-12">
            <div className="text-center mb-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 p-2.5 text-white shadow-lg shadow-violet-500/20 mb-4 animate-bounce">
                <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-full h-full">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l-1.922 4.613a1 1 0 001.275 1.275l4.613-1.922c.328-.137.66-.282.977-.442l1.62-1.62a1 1 0 00-1.414-1.414l-1.62 1.62c-.16.317-.305.649-.442.977l-4.613 1.922 1.922-4.613c.137-.328.282-.66.442-.977l1.62-1.62a1 1 0 00-1.414-1.414l-1.62 1.62c-.317.16-.649.305-.977.442z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.828m2.829 2.828L21 21M5.636 5.636a9 9 0 000 12.728m0 0l2.828-2.828" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white">Ask your Knowledge Base</h2>
              <p className="text-xs text-zinc-500 mt-1">Start chatting with your documents. Select a suggestion below or write a query.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.map((card, idx) => (
                <button
                  key={idx}
                  onClick={() => onSend(card.prompt)}
                  className="flex flex-col text-left p-4 rounded-xl border border-white/5 bg-zinc-900/20 hover:bg-zinc-900/40 hover:border-violet-500/20 transition-all group active:scale-[0.98]"
                >
                  <span className="text-xs font-semibold text-white group-hover:text-violet-400 transition-colors">{card.title}</span>
                  <span className="text-[10px] text-zinc-500 mt-1 leading-normal">{card.desc}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Active message log */
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => {
              const date = msg.timestamp || (msg.createdAt ? new Date(msg.createdAt) : new Date());
              const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={msg.id} className={`flex items-start gap-4 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center font-bold text-xs text-white shadow-sm flex-shrink-0">
                      AI
                    </div>
                  )}

                  <div className="flex flex-col max-w-[85%] space-y-1.5">
                    <div className={`flex items-center gap-2 text-[10px] text-zinc-500 ${msg.role === "user" ? "justify-end" : ""}`}>
                      <span className="font-semibold text-zinc-400">
                        {msg.role === "user" ? (userSession?.user?.name || "User") : "Assistant"}
                      </span>
                      <span>•</span>
                      <span>{timeString}</span>
                    </div>

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

                    {msg.role === "assistant" && msg.sources && (Array.isArray(msg.sources) ? msg.sources : JSON.parse(msg.sources || "[]")).length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-1.5 pl-1">
                        <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">Citations:</span>
                        {(Array.isArray(msg.sources) ? msg.sources : JSON.parse(msg.sources || "[]")).map((src: MessageSource, sIdx: number) => (
                          <div
                            key={sIdx}
                            className="inline-flex items-center gap-1 rounded bg-zinc-900 border border-white/5 hover:border-zinc-700 px-2 py-0.5 text-[9px] text-zinc-400 hover:text-white font-mono cursor-help transition-all"
                            title={`Referenced from ${src.name}`}
                          >
                            <svg className="w-2.5 h-2.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>{src.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="flex-shrink-0">
                      {userSession?.user?.image ? (
                        <div className="relative h-8 w-8 overflow-hidden rounded-lg ring-1 ring-white/10">
                          <Image
                            src={userSession.user.image}
                            alt={userSession.user.name || "User"}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-300 border border-white/5">
                          {userSession?.user?.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pulsing loading state */}
            {isSearching && (
              <div className="flex items-start gap-4 animate-fade-in">
                <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-400 flex-shrink-0 border border-white/5 animate-pulse">
                  AI
                </div>
                <div className="flex flex-col space-y-1.5">
                  <div className="text-[9px] text-zinc-500">Scanning embeddings index...</div>
                  <div className="flex items-center gap-1.5 bg-zinc-900/40 border border-white/5 p-4 rounded-2xl rounded-tl-none text-xs text-zinc-500">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                    </span>
                    Performing pgvector similarity match...
                  </div>
                </div>
              </div>
            )}

            {/* Typing loader */}
            {isTyping && !isSearching && (
              <div className="flex items-start gap-4 animate-fade-in">
                <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center font-bold text-xs text-violet-400 flex-shrink-0">
                  AI
                </div>
                <div className="flex flex-col space-y-1.5">
                  <div className="text-[9px] text-zinc-500">Formulating response...</div>
                  <div className="bg-zinc-900/60 border border-white/5 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input box bottom */}
      <div className="p-6 border-t border-white/5 bg-zinc-950/20 max-w-3xl w-full mx-auto flex-shrink-0">
        <div className="relative rounded-2xl border border-white/5 bg-zinc-900/50 p-2 focus-within:border-violet-500/40 transition-colors shadow-lg backdrop-blur-sm">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSearching || isTyping}
            placeholder="Ask a question about your knowledge base..."
            rows={2}
            className="w-full resize-none bg-transparent px-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none disabled:opacity-50"
          />
          <div className="flex items-center justify-between border-t border-white/5 pt-2 px-2 mt-1">
            <div className="text-[10px] text-zinc-600 font-medium pl-2">
              Press Enter to send, Shift+Enter for new line
            </div>

            <button
              onClick={() => onSend(input)}
              disabled={!input.trim() || isSearching || isTyping}
              className="inline-flex h-8 items-center justify-center rounded-lg bg-violet-600 px-4 text-xs font-semibold text-white hover:bg-violet-500 shadow-md shadow-violet-600/10 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-[0.97]"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { Session } from "next-auth";
import { Logo } from "@/app/components/Logo";
import { signOut } from "next-auth/react";
import { ChatSessionSummary, Source } from "../../actions/chat";

interface ChatSidebarProps {
  sources: Source[];
  sessions: ChatSessionSummary[];
  activeSessionId: string | null;
  userSession: Session | null;
  onSessionSelect: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
}

export function ChatSidebar({
  sources,
  sessions,
  activeSessionId,
  userSession,
  onSessionSelect,
  onNewChat,
  onDeleteSession,
}: ChatSidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-66 border-r border-white/5 bg-zinc-950/90 relative z-10 flex-shrink-0">
      {/* Brand header */}
      <div className="h-16 px-5 border-b border-white/5 flex items-center gap-2.5">
        <Logo iconSize={7} />
        <div className="flex flex-col">
          <span className="font-bold text-xs leading-none text-white">Knowledge Hub</span>
          <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest mt-0.5">Assistant</span>
        </div>
      </div>

      {/* New chat action */}
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full flex h-10 items-center justify-center gap-2 rounded-xl border border-white/5 bg-zinc-900/50 hover:bg-zinc-900 text-xs font-semibold text-white transition-all shadow-sm active:scale-[0.98]"
        >
          <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Conversation
        </button>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        <div className="px-4 text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Previous Chats</div>
        {sessions.length === 0 ? (
          <div className="px-4 py-3 text-[11px] text-zinc-600 italic">No conversations yet</div>
        ) : (
          sessions.map((chat) => (
            <div
              key={chat.id}
              className={`group w-full flex items-center justify-between rounded-xl transition-all ${
                activeSessionId === chat.id
                  ? "bg-zinc-900 border border-white/5 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
              }`}
            >
              <button
                onClick={() => onSessionSelect(chat.id)}
                className="flex-1 flex items-center gap-2 px-3 py-2.5 text-xs text-left truncate min-w-0"
              >
                <svg className={`w-3.5 h-3.5 flex-shrink-0 ${activeSessionId === chat.id ? "text-violet-400" : "text-zinc-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="truncate">{chat.title || "Untitled Conversation"}</span>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(chat.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 mr-1.5 text-zinc-600 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition-all"
                title="Delete chat session"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Sources vectorized */}
      <div className="p-4 border-t border-white/5 bg-zinc-950/20 max-h-48 overflow-y-auto">
        <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          Active Context
        </div>
        <div className="space-y-1.5">
          {sources.length === 0 ? (
            <div className="text-[10px] text-zinc-600 italic px-2">No documents indexed.</div>
          ) : (
            sources.slice(0, 5).map((src, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg bg-zinc-900/30 px-3 py-1.5 text-[10px]"
              >
                <span className="text-zinc-400 truncate max-w-[140px]" title={src.name}>
                  {src.name}
                </span>
                <span className="text-[9px] font-mono text-zinc-600">{src.chunks} chk</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer / User Session */}
      <div className="p-4 border-t border-white/5 bg-zinc-950 space-y-2">
        <Link
          href="/upload"
          className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload More Docs
        </Link>
        
        {userSession ? (
          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {userSession.user?.image ? (
                <img
                  src={userSession.user.image}
                  alt={userSession.user.name || "User"}
                  className="h-7 w-7 rounded-lg object-cover ring-1 ring-white/10"
                />
              ) : (
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center font-bold text-xs text-white">
                  {userSession.user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-medium text-white truncate max-w-[100px]">
                  {userSession.user?.name || "User"}
                </span>
                <span className="text-[8px] text-zinc-500 truncate max-w-[100px]">
                  {userSession.user?.email}
                </span>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-zinc-900 transition-colors"
              title="Logout"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        ) : (
          <Link
            href="/auth/signin"
            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-white transition-colors"
          >
            Sign In / Register
          </Link>
        )}
      </div>
    </aside>
  );
}

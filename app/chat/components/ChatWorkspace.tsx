"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChatSidebar } from "./ChatSidebar";
import { ChatWindow, ChatMessageData } from "./ChatWindow";
import {
  getEmbeddedSources,
  generateSuggestions,
  getChatSessions,
  createChatSession,
  getChatSessionDetails,
  deleteChatSession,
  askKnowledgeBase,
  MessageSource,
} from "../../actions/chat";

interface ChatWorkspaceProps {
  sessionId?: string;
}

// Reads guest session IDs from localStorage (client-only)
function getGuestSessionIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(
      localStorage.getItem("kb_assistant_guest_sessions") || "[]",
    );
  } catch {
    return [];
  }
}

function addGuestSessionId(id: string) {
  if (typeof window === "undefined") return;
  try {
    const ids = getGuestSessionIds();
    if (!ids.includes(id)) {
      localStorage.setItem(
        "kb_assistant_guest_sessions",
        JSON.stringify([...ids, id]),
      );
    }
  } catch {
    // ignore
  }
}

export function ChatWorkspace({ sessionId = "" }: ChatWorkspaceProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [input, setInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [indexWorkspace, setIndexWorkspace] = useState("main-kb");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: sources = [] } = useQuery({
    queryKey: ["sources"],
    queryFn: getEmbeddedSources,
  });

  const { data: suggestions = [] } = useQuery({
    queryKey: ["suggestions", sources.map((s) => s.name)],
    queryFn: () => generateSuggestions(sources.map((s) => s.name)),
    staleTime: 5 * 60 * 1000,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions", session?.user?.email ?? "guest"],
    queryFn: () => getChatSessions(getGuestSessionIds()),
  });

  const { data: sessionDetails } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => getChatSessionDetails(sessionId),
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (sessionDetails) {
      setMessages(
        sessionDetails.messages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          createdAt: m.createdAt,
          sources: m.sources as MessageSource[] | null,
        })),
      );
    } else if (!sessionId) {
      setMessages([]);
    }
  }, [sessionDetails, sessionId]);

  // ── Scroll to bottom ──────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSearching, isTyping]);

  // Stream simulation (character by character)
  const streamResponse = (text: string, citationSources: MessageSource[]) => {
    setIsTyping(true);
    let currentText = "";
    let i = 0;
    const speed = 10; // ms per char

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
              sources: citationSources,
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

  // Send message handler
  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessageData = {
      id: Math.random().toString(36).substring(7),
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSearching(true);

    let activeId = sessionId;

    try {
      // Create session first if on new chat
      if (!activeId) {
        const newSession = await createChatSession("New Chat");
        activeId = newSession.id;
        if (!session) {
          addGuestSessionId(activeId);
        }
        // Redirect client dynamically to chat ID route
        router.replace(`/chat/${activeId}`);
      }

      const response = await askKnowledgeBase(textToSend, activeId);
      setIsSearching(false);

      // Refresh session list in sidebar
      queryClient.invalidateQueries({ queryKey: ["sessions"] });

      streamResponse(response.content, response.sources);
    } catch (err) {
      console.error("Error sending message:", err);
      setIsSearching(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          role: "assistant",
          content: "Sorry, I encountered an error processing your question.",
        },
      ]);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteChatSession(id);

      if (!session) {
        const ids = getGuestSessionIds().filter((sid) => sid !== id);
        localStorage.setItem(
          "kb_assistant_guest_sessions",
          JSON.stringify(ids),
        );
      }

      queryClient.invalidateQueries({ queryKey: ["sessions"] });

      if (sessionId === id) {
        router.push("/chat");
      }
    } catch (err) {
      console.error("Error deleting session:", err);
    }
  };

  const handleSessionSelect = (id: string) => {
    router.push(`/chat/${id}`);
  };

  const handleNewChat = () => {
    router.push("/chat");
  };

  return (
    <div className="relative flex h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Background radial glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293704_1px,transparent_1px),linear-gradient(to_bottom,#1f293704_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />

      {/* Reusable Sidebar */}
      <ChatSidebar
        sources={sources}
        sessions={sessions}
        activeSessionId={sessionId || null}
        userSession={session}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />

      {/* Reusable Window */}
      <ChatWindow
        messages={messages}
        input={input}
        setInput={setInput}
        isSearching={isSearching}
        isTyping={isTyping}
        suggestions={suggestions}
        indexWorkspace={indexWorkspace}
        setIndexWorkspace={setIndexWorkspace}
        userSession={session}
        messagesEndRef={messagesEndRef}
        onSend={handleSend}
      />
    </div>
  );
}

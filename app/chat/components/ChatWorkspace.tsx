"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
  Source,
  Suggestion,
  ChatSessionSummary,
  MessageSource,
} from "../../actions/chat";

interface ChatWorkspaceProps {
  sessionId?: string;
}

export function ChatWorkspace({ sessionId = "" }: ChatWorkspaceProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const [sources, setSources] = useState<Source[]>([]);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [input, setInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [indexWorkspace, setIndexWorkspace] = useState("main-kb");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Initial Load: Sources & Suggestions & Session List
  useEffect(() => {
    async function loadInitialData() {
      try {
        const activeSources = await getEmbeddedSources();
        setSources(activeSources);

        const activeSuggestions = await generateSuggestions(
          activeSources.map((s) => s.name),
        );
        setSuggestions(activeSuggestions);

        await refreshSessionsList();
      } catch (err) {
        console.error("Error loading initial chat data:", err);
      }
    }
    loadInitialData();
  }, [session]);

  // 2. Load message history when sessionId changes
  useEffect(() => {
    if (sessionId) {
      async function loadSessionDetails() {
        try {
          const details = await getChatSessionDetails(sessionId);
          if (details) {
            setMessages(
              details.messages.map((m) => ({
                id: m.id,
                role: m.role as "user" | "assistant",
                content: m.content,
                createdAt: m.createdAt,
                sources: m.sources,
              })),
            );
          } else {
            // Session not found, redirect to root chat
            router.push("/chat");
          }
        } catch (err) {
          console.error("Error loading session details:", err);
          router.push("/chat");
        }
      }
      loadSessionDetails();
    } else {
      setMessages([]);
    }
  }, [sessionId]);

  // 3. Scroll to bottom when messages change or loading
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSearching, isTyping]);

  // Helper: Retrieve guest sessions list from localStorage
  const getGuestSessionIds = (): string[] => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("kb_assistant_guest_sessions") || "[]");
    } catch {
      return [];
    }
  };

  // Helper: Save guest session ID to localStorage
  const addGuestSessionId = (id: string) => {
    if (typeof window === "undefined") return;
    try {
      const ids = getGuestSessionIds();
      if (!ids.includes(id)) {
        ids.push(id);
        localStorage.setItem("kb_assistant_guest_sessions", JSON.stringify(ids));
      }
    } catch (err) {
      console.error("LocalStorage error:", err);
    }
  };

  // Helper: Refresh session list
  const refreshSessionsList = async () => {
    try {
      const guestIds = getGuestSessionIds();
      const list = await getChatSessions(guestIds);
      setSessions(list);
    } catch (err) {
      console.error("Error updating session list:", err);
    }
  };

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
          return [
            ...prev.slice(0, -1),
            { ...lastMsg, content: currentText },
          ];
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
      
      // Update sidebar session summaries
      await refreshSessionsList();

      // Stream the Gemini response
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

      // Remove from localStorage if guest
      if (!session) {
        const ids = getGuestSessionIds().filter((sid) => sid !== id);
        localStorage.setItem("kb_assistant_guest_sessions", JSON.stringify(ids));
      }

      await refreshSessionsList();

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

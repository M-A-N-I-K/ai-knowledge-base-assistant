"use client";

import { use } from "react";
import { ChatWorkspace } from "../components/ChatWorkspace";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ChatSessionPage({ params }: PageProps) {
  const resolvedParams = use(params);
  return <ChatWorkspace sessionId={resolvedParams.id} />;
}

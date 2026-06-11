"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, DragEvent, ChangeEvent } from "react";
import Image from "next/image";
import { LogoWithText } from "@/app/components/Logo";

interface StagedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: "idle" | "uploading" | "processing" | "success" | "error";
  errorMsg?: string;
}

export default function UploadPage() {
  const { data: session } = useSession();
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [chunkSize, setChunkSize] = useState(1000);
  const [chunkOverlap, setChunkOverlap] = useState(200);
  const [indexDestination, setIndexDestination] = useState("main-kb");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to format file size
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const addFiles = (selectedFiles: FileList) => {
    const newFiles: StagedFile[] = Array.from(selectedFiles).map((file) => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      type: file.name.split(".").pop() || "unknown",
      progress: 0,
      status: "idle",
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      addFiles(e.target.files);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const startMockUpload = () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    files.forEach((file) => {
      if (file.status === "success") return;
      
      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: "uploading", progress: 0 } : f))
      );

      // Simulate upload progress
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 15) + 5;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          
          // Switch to processing/vectorizing
          setFiles((prev) =>
            prev.map((f) => (f.id === file.id ? { ...f, status: "processing", progress: 100 } : f))
          );

          // Simulate vector database indexing
          setTimeout(() => {
            setFiles((prev) =>
              prev.map((f) => (f.id === file.id ? { ...f, status: "success" } : f))
            );
            // If all files are success, stop global processing
            setFiles((prev) => {
              const allDone = prev.every((f) => f.status === "success" || f.status === "error");
              if (allDone) {
                setIsProcessing(false);
              }
              return prev;
            });
          }, 1500);
        } else {
          setFiles((prev) =>
            prev.map((f) => (f.id === file.id ? { ...f, progress: currentProgress } : f))
          );
        }
      }, 150);
    });
  };

  const clearStaged = () => {
    setFiles([]);
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden selection:bg-violet-500/30 selection:text-white">
      {/* Background radial glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-violet-900/10 via-cyan-900/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] rounded-full bg-violet-600/5 blur-3xl pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293704_1px,transparent_1px),linear-gradient(to_bottom,#1f293704_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-zinc-950/70 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <LogoWithText />

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 px-4 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Workspace Grid */}
      <main className="flex-1 w-full mx-auto max-w-7xl px-6 py-12 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Upload & Staged Files (Takes 2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Guest Warning / Guest Mode alert */}
          {!session && (
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm text-yellow-200/90 flex items-start gap-3 backdrop-blur-sm">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-yellow-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <span className="font-semibold text-white">Guest Mode Active.</span> Staged files will simulate chunking, embedding, and vectorization, but will not be persisted to the Neon Postgres database.{" "}
                <Link href="/auth/signin" className="underline text-yellow-400 font-medium hover:text-yellow-300">Sign in now</Link> to save documents.
              </div>
            </div>
          )}

          {/* Heading */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Upload Knowledge Sources</h1>
            <p className="text-sm text-zinc-400 mt-1">Upload documents to expand your AI Knowledge Base. Staged files will be processed, chunked, and embedded into the vector index.</p>
          </div>

          {/* Drag & Drop Box */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
            className={`group relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 backdrop-blur-sm ${
              dragActive
                ? "border-violet-500 bg-violet-950/15 shadow-lg shadow-violet-500/5"
                : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/10 hover:bg-zinc-900/20"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileInput}
              className="hidden"
              accept=".pdf,.txt,.docx,.md,.json"
            />
            
            {/* Animated cloud icon */}
            <div className={`h-14 w-14 rounded-full bg-zinc-900/80 border border-white/5 flex items-center justify-center text-zinc-400 mb-4 group-hover:scale-110 group-hover:text-violet-400 transition-all duration-300 ${dragActive ? "scale-110 text-violet-400 border-violet-500/20" : ""}`}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            </div>

            <h3 className="text-base font-semibold text-white">Drag and drop your files here</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs">
              Supports <strong className="text-zinc-300">PDF, TXT, DOCX, Markdown,</strong> or <strong className="text-zinc-300">JSON</strong> (up to 50MB per file).
            </p>
            
            <button
              type="button"
              className="mt-6 rounded-lg bg-zinc-900 border border-white/5 hover:border-zinc-700 hover:bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition-all"
            >
              Browse Files
            </button>

            {dragActive && (
              <div className="absolute inset-0 rounded-2xl bg-violet-600/5 pointer-events-none" />
            )}
          </div>

          {/* Staged Files List */}
          {files.length > 0 && (
            <div className="border border-white/5 rounded-2xl bg-zinc-900/20 p-6 space-y-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-zinc-300">Staged Files ({files.length})</div>
                <button
                  onClick={clearStaged}
                  disabled={isProcessing}
                  className="text-xs text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex flex-col gap-2 rounded-xl border border-white/5 bg-zinc-950/60 p-4 relative overflow-hidden group"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* File extension type icon */}
                        <div className="h-9 w-9 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-[10px] font-bold text-violet-400 uppercase">
                          {file.type}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate max-w-[240px] sm:max-w-[340px]">
                            {file.name}
                          </p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {formatBytes(file.size)}
                          </p>
                        </div>
                      </div>

                      {/* Status / Actions */}
                      <div className="flex items-center gap-3">
                        {file.status === "idle" && (
                          <button
                            onClick={() => removeFile(file.id)}
                            disabled={isProcessing}
                            className="text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 p-1.5 rounded-lg transition-all"
                            title="Remove file"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}

                        {file.status === "uploading" && (
                          <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-0.5 rounded-full font-semibold animate-pulse">
                            Uploading
                          </span>
                        )}

                        {file.status === "processing" && (
                          <span className="text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2.5 py-0.5 rounded-full font-semibold animate-pulse">
                            Indexing
                          </span>
                        )}

                        {file.status === "success" && (
                          <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            Success
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar for active uploads */}
                    {(file.status === "uploading" || file.status === "processing") && (
                      <div className="space-y-1 mt-2">
                        <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              file.status === "processing"
                                ? "bg-gradient-to-r from-violet-500 to-cyan-500 w-full"
                                : "bg-cyan-500"
                            }`}
                            style={{ width: file.status === "processing" ? "100%" : `${file.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-zinc-500">
                          <span>{file.status === "processing" ? "Vectorizing chunks..." : "Streaming bits..."}</span>
                          <span>{file.status === "processing" ? "100%" : `${file.progress}%`}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action trigger */}
              <div className="pt-2">
                <button
                  onClick={startMockUpload}
                  disabled={isProcessing}
                  className="w-full flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 font-semibold text-white shadow-lg shadow-violet-600/20 hover:from-violet-500 hover:to-cyan-500 hover:shadow-violet-600/30 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all"
                >
                  {isProcessing ? "Processing Knowledge Base..." : `Process ${files.length} Staged Document${files.length > 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Advanced Index Configurations & Integrations (1/3 width) */}
        <div className="space-y-6">
          
          {/* Advanced Configurations */}
          <div className="border border-white/5 rounded-2xl bg-zinc-900/20 p-6 space-y-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <h2 className="text-sm font-semibold text-white">Indexing Configuration</h2>
            </div>

            {/* Selector: Destination Index */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Destination Workspace</label>
              <select
                value={indexDestination}
                onChange={(e) => setIndexDestination(e.target.value)}
                disabled={isProcessing}
                className="w-full rounded-xl border border-white/5 bg-zinc-950 p-3 text-sm text-zinc-200 focus:outline-none focus:border-violet-500/50 transition-colors"
              >
                <option value="main-kb">Main Knowledge Base (Default)</option>
                <option value="dev-sandbox">Engineering Sandbox</option>
                <option value="prod-docs">Production Document Center</option>
              </select>
            </div>

            {/* Slider: Chunk size */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-zinc-400 uppercase tracking-wider">Chunk Size</label>
                <span className="text-cyan-400 font-mono font-medium">{chunkSize} tokens</span>
              </div>
              <input
                type="range"
                min="200"
                max="3000"
                step="100"
                value={chunkSize}
                onChange={(e) => setChunkSize(parseInt(e.target.value))}
                disabled={isProcessing}
                className="w-full accent-violet-500 bg-zinc-950 rounded-lg cursor-pointer h-1.5"
              />
              <p className="text-[10px] text-zinc-500 leading-normal">
                Determines the max length of database text blocks parsed. Larger chunks capture more context but can introduce noise.
              </p>
            </div>

            {/* Slider: Chunk overlap */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-zinc-400 uppercase tracking-wider">Chunk Overlap</label>
                <span className="text-cyan-400 font-mono font-medium">{chunkOverlap} tokens</span>
              </div>
              <input
                type="range"
                min="0"
                max="800"
                step="50"
                value={chunkOverlap}
                onChange={(e) => setChunkOverlap(parseInt(e.target.value))}
                disabled={isProcessing}
                className="w-full accent-violet-500 bg-zinc-950 rounded-lg cursor-pointer h-1.5"
              />
              <p className="text-[10px] text-zinc-500 leading-normal">
                Defines shared token spacing between sequential text blocks. Prevents loss of context at chunk margins.
              </p>
            </div>
          </div>

          {/* Sync integrations card */}
          <div className="border border-white/5 rounded-2xl bg-zinc-900/20 p-6 space-y-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <h2 className="text-sm font-semibold text-white">Sync Cloud Sources</h2>
            </div>
            
            <p className="text-xs text-zinc-500 leading-relaxed">
              Auto-sync and re-index changes continuously from your team's cloud repositories.
            </p>

            <div className="space-y-2">
              <button
                disabled
                className="w-full flex items-center justify-between rounded-xl border border-white/5 bg-zinc-950/60 p-3.5 text-xs text-zinc-400 hover:text-white hover:border-zinc-800 transition-all opacity-60 cursor-not-allowed"
              >
                <span className="flex items-center gap-2.5">
                  {/* Notion logo SVG mock */}
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4.3 3h15.4c.7 0 1.3.6 1.3 1.3v15.4c0 .7-.6 1.3-1.3 1.3H4.3c-.7 0-1.3-.6-1.3-1.3V4.3C3 3.6 3.6 3 4.3 3zm1.2 3.6v10.8l4.4-1.2V5.4L5.5 6.6zm7.2.9L18.5 6V18l-5.8-.3V7.5z"/>
                  </svg>
                  Sync Notion
                </span>
                <span className="text-[9px] uppercase font-mono bg-zinc-900 border border-white/5 px-2 py-0.5 rounded text-zinc-500">Coming Soon</span>
              </button>

              <button
                disabled
                className="w-full flex items-center justify-between rounded-xl border border-white/5 bg-zinc-950/60 p-3.5 text-xs text-zinc-400 hover:text-white hover:border-zinc-800 transition-all opacity-60 cursor-not-allowed"
              >
                <span className="flex items-center gap-2.5">
                  {/* Google Drive logo SVG mock */}
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.4 13l-6.2-10.7c-.2-.4-.7-.7-1.2-.7H3.2c-.5 0-1 .3-1.2.7L1.8 4c-.2.4-.2.9 0 1.3l6.2 10.7c.2.4.7.7 1.2.7h8.8c.5 0 1-.3 1.2-.7l.2-1.3c.2-.4.2-.9 0-1.3z"/>
                  </svg>
                  Sync Google Drive
                </span>
                <span className="text-[9px] uppercase font-mono bg-zinc-900 border border-white/5 px-2 py-0.5 rounded text-zinc-500">Coming Soon</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 bg-zinc-950 py-8 relative z-10 text-center">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-400">AI Knowledge Base Assistant</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-zinc-300">Privacy Policy</Link>
            <Link href="#" className="hover:text-zinc-300">Terms of Service</Link>
            <Link href="#" className="hover:text-zinc-300">System Status</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

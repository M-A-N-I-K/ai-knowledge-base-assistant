"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState } from "react";

function SignInContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (err) {
      console.error("Sign in failed:", err);
      setLoading(false);
    }
  };

  const getErrorMessage = (errType: string) => {
    switch (errType.toLowerCase()) {
      case "oauthsignin":
      case "oauthcallback":
        return "Could not connect to Google. Please check your credentials or try again.";
      case "oauthcreateaccount":
        return "Could not create user account using Google authentication.";
      case "callback":
        return "Error occurred during authentication callback.";
      default:
        return "An unexpected authentication error occurred. Please try again.";
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Back to landing */}
      <div className="mb-8 text-left">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <svg
            className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to home
        </Link>
      </div>

      {/* Main Glassmorphic Card */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-xl">
        {/* Glow corner decoration */}
        <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-violet-600/30 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 h-24 w-24 rounded-full bg-cyan-600/30 blur-2xl pointer-events-none" />

        {/* Card Header */}
        <div className="mb-8 text-center relative z-10">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 p-2.5 text-white shadow-lg shadow-violet-500/20 mb-4">
            <svg
              className="h-full w-full"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Welcome to AI Knowledge Base
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Sign in or create an account to start managing and querying your knowledge.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 relative z-10">
          {/* Error message if exists */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-400 flex items-start gap-2.5">
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>{getErrorMessage(error)}</span>
            </div>
          )}

          {/* Social Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-zinc-800 hover:border-zinc-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.186 4.114-3.478 0-6.3-2.822-6.3-6.3 0-3.478 2.822-6.3 6.3-6.3 1.637 0 3.125.614 4.254 1.72l3.244-3.244C19.164 2.454 15.932 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 11.24-4.542 11.24-11.24 0-.76-.08-1.503-.226-2.22H12.24z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
            <div className="absolute inset-0 rounded-xl ring-2 ring-violet-500/0 group-hover:ring-violet-500/20 transition-all pointer-events-none" />
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="absolute inset-x-0 h-px bg-zinc-800" />
            <span className="relative z-10 bg-zinc-900/60 px-3 text-xs uppercase tracking-wider text-zinc-500">
              Secured Connection
            </span>
          </div>

          {/* Additional Info */}
          <div className="text-center text-xs text-zinc-500 space-y-1">
            <p>
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
            <p className="flex items-center justify-center gap-1 text-zinc-600">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              Standard OAuth 2.0 encrypted session tokens.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-zinc-950 overflow-hidden">
      {/* Animated glowing orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] rounded-full bg-cyan-600/10 blur-3xl animate-pulse pointer-events-none" />

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40" />

      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center space-y-4">
            <svg
              className="animate-spin h-10 w-10 text-violet-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-sm text-zinc-400">Loading sign in...</p>
          </div>
        }
      >
        <SignInContent />
      </Suspense>
    </div>
  );
}

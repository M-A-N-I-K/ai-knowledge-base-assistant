"use client";

import { signOut, signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    await signOut({ callbackUrl: "/" });
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="cusor-pointer inline-flex h-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 px-4 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors disabled:opacity-50"
    >
      {loading ? "Signing out..." : "Sign Out"}
    </button>
  );
}

export function SignInButton() {
  return (
    <Link
      href="/auth/signin"
      className="inline-flex h-9 items-center justify-center rounded-lg bg-white px-4 text-sm font-medium text-zinc-950 hover:bg-zinc-200 transition-colors shadow-sm"
    >
      Sign In
    </Link>
  );
}

export function GetStartedButton({ isLoggedIn }: { isLoggedIn: boolean }) {
  if (isLoggedIn) {
    return (
      <Link
        href="#features"
        className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-6 font-semibold text-white shadow-lg shadow-violet-600/20 hover:from-violet-500 hover:to-cyan-500 hover:shadow-violet-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        Explore Features
      </Link>
    );
  }

  return (
    <Link
      href="/auth/signin"
      className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-6 font-semibold text-white shadow-lg shadow-violet-600/20 hover:from-violet-500 hover:to-cyan-500 hover:shadow-violet-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
    >
      Get Started Free
    </Link>
  );
}

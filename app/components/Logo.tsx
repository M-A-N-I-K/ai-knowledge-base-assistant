"use client";

import Link from "next/link";

interface LogoProps {
  className?: string;
  iconSize?: number;
}

export function Logo({ className = "", iconSize = 9 }: LogoProps) {
  const sizeClass = `h-${iconSize} w-${iconSize}`;

  return (
    <div
      className={`relative flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 p-2 text-white shadow-lg shadow-violet-500/15 group overflow-hidden ${sizeClass} ${className}`}
    >
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 opacity-20 blur-sm group-hover:opacity-40 transition-opacity duration-300 pointer-events-none" />

      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-[0_2px_8px_rgba(139,92,246,0.3)]"
      >
        <path
          d="M5 19H19V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5V19Z"
          fill="url(#logo-bg-gradient)"
          fillOpacity="0.15"
          className="group-hover:fill-opacity-25 transition-all duration-300"
        />

        <path
          d="M8 7H16"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          className="opacity-40 group-hover:opacity-70 group-hover:translate-x-0.5 transition-all duration-300"
        />
        <path
          d="M8 11H14"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          className="opacity-40 group-hover:opacity-70 group-hover:translate-x-0.5 transition-all duration-300 delay-75"
        />

        <path
          d="M17 12V10.5C17 9.67 17.67 9 18.5 9C19.33 9 20 9.67 20 10.5V12M17 12V14.5C17 15.33 16.33 16 15.5 16C14.67 16 14 15.33 14 14.5V12"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          className="text-cyan-300 opacity-90 group-hover:text-white transition-colors duration-300"
        />

        <path
          d="M12 11.5C12 11.5 13.5 12 14 13.5C14.5 12 16 11.5 16 11.5C16 11.5 14.5 11 14 9.5C13.5 11 12 11.5 12 11.5Z"
          fill="currentColor"
          className="text-cyan-300 group-hover:scale-110 group-hover:rotate-45 transform origin-center transition-all duration-500 ease-out"
        />

        <circle
          cx="6"
          cy="6"
          r="1.25"
          fill="currentColor"
          className="text-violet-300 group-hover:translate-y-0.5 transition-transform"
        />
        <circle
          cx="6"
          cy="12"
          r="1.25"
          fill="currentColor"
          className="text-violet-300"
        />
        <circle
          cx="6"
          cy="18"
          r="1.25"
          fill="currentColor"
          className="text-violet-300 group-hover:-translate-y-0.5 transition-transform"
        />

        <path
          d="M6 6L12 11.5M6 12L12 11.5M6 18L12 11.5"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 2"
          className="opacity-30 text-violet-300"
        />

        <defs>
          <linearGradient
            id="logo-bg-gradient"
            x1="5"
            y1="3"
            x2="19"
            y2="19"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#a78bfa" />
            <stop offset="1" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export function LogoWithText({ iconSize = 9 }: { iconSize?: number }) {
  return (
    <Link href="/" className="flex items-center gap-3 group">
      <Logo iconSize={iconSize} />
      <div className="flex flex-col">
        <span className="font-bold tracking-tight text-white text-base leading-none group-hover:text-zinc-200 transition-colors">
          AI Knowledge Base
        </span>
        <span className="text-[10px] text-zinc-400 font-semibold tracking-wider uppercase mt-0.5 group-hover:text-violet-400 transition-colors">
          Assistant
        </span>
      </div>
    </Link>
  );
}

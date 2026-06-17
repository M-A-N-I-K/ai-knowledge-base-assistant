import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "officeparser"],
  images: {
    remotePatterns: [
      new URL("https://lh3.googleusercontent.com/**"),
    ],
  },
};

export default nextConfig;

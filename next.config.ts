import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "officeparser"],
};

export default nextConfig;

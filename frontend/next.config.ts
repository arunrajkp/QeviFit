import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow deployment on Vercel with standalone output
  output: "standalone",

  // Suppress build warnings for dynamic server usage
  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
  },

  // Allow images from any HTTPS source
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Expose API URL to client
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  },
};

export default nextConfig;

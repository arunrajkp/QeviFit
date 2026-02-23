import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

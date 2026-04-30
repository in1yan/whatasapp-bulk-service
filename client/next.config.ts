import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || 
  (process.env.NODE_ENV === "production" ? "http://server:8000" : "http://localhost:8000");

console.log(`[Next.config] Proxying /api/v1 to ${BACKEND_URL}`);

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND_URL}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compile React components for automatic rendering optimizations.
  reactCompiler: true,
  images: {
    // Remote images are limited to the providers this app actually stores.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        pathname: "/api/**",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/v0/b/skill-swap-hub-eca37.firebasestorage.app/o/**",
      },
    ],
  },
};

export default nextConfig;

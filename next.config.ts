import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compile React components for automatic rendering optimizations.
  reactCompiler: true,
  images: {
    // Provider fallback avatars are the only approved remote image source.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        pathname: "/api/**",
      },
    ],
  },
};

export default nextConfig;

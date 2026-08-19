import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compile React components for automatic rendering optimizations.
  reactCompiler: true,
  // Silence multiple lockfiles workspace root warning.
  turbopack: {
    root: __dirname,
  },
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

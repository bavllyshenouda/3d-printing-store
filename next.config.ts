import type { NextConfig } from "next";

// Allow Next.js <Image> to optimize assets served from Supabase Storage
// (product images, category images, etc.). The project reference is read from
// the public env var when available, with a wildcard fallback for any
// *.supabase.co project so previews/production hosts all work.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl
  ? new URL(supabaseUrl).hostname
  : undefined;

const nextConfig: NextConfig = {
  /* config options here */
    allowedDevOrigins: [
    "*.trycloudflare.com",
  ],


  experimental: {
    agentFeedback: true,
  },
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/**",
      },
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/**",
            },
          ]
        : []),
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

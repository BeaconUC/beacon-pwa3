import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa"

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {key: "X-Content-Type-Options", value: "nosniff"},
          {key: "X-Frame-Options", value: "DENY"},
          {key: "Referrer-Policy", value: "strict-origin-when-cross-origin"},
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {key: "Content-Type", value: "application/javascript; charset=utf-8"},
          {key: "Cache-Control", value: "no-cache, no-store, must-revalidate"},
          {key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'"},
        ],
      },
    ];
  },
  allowedDevOrigins: [
    "local-origin.dev",
    "*.local-origin.dev",
  ],
};

const withPWAConfig = withPWA({
  dest: "public",
})(nextConfig);

export default withPWAConfig;
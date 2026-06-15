// ============================================================
//  NidiRoom — next.config.ts
//  Configuration Next.js — output standalone pour Docker
// ============================================================

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Active le mode standalone pour Docker
  // Produit un bundle autonome dans .next/standalone
  output: "standalone",

  // Autorise les domaines d'images externes
  images: {
    remotePatterns: [
      {
        // MinIO local
        protocol: "http",
        hostname:  "localhost",
        port:      "9000",
        pathname:  "/nidiroom-images/**",
      },
      {
        // MinIO en production Docker
        protocol: "http",
        hostname:  "minio",
        port:      "9000",
        pathname:  "/nidiroom-images/**",
      },
    ],
  },

  // Désactive la télémétrie Next.js
  experimental: {},
};

export default nextConfig;

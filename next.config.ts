import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Debe coincidir con IMAGE_MAX_BYTES (8 MB) en src/lib/validation/media.ts.
      // Sin esto, Next.js rechaza cualquier subida mayor a 1 MB (su valor por defecto).
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mendaftarkan IP lokal agar fitur "Live Reload" tidak diblokir
  allowedDevOrigins: ['192.168.56.1', 'localhost'],
};

export default nextConfig;
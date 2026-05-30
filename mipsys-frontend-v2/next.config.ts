import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['192.168.56.1', 'localhost', 'standalone'],
};

export default nextConfig;

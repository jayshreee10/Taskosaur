import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  transpilePackages: ['@uiw/react-md-editor', '@uiw/react-markdown-preview']
};

export default nextConfig;

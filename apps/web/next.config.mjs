/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@workspace/ui'],
  env: {
    NEXT_PUBLIC_ENOKI_API_KEY: process.env.NEXT_PUBLIC_ENOKI_API_KEY,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  },
  images: {
    domains: ['igstatic.igxe.cn'],
  },
};

export default nextConfig;

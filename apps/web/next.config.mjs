/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@workspace/ui'],
  images: {
    domains: ['igstatic.igxe.cn'],
  },
};

export default nextConfig;

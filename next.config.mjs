/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow partner logo/photo uploads (up to ~5 MB each) through server actions
  experimental: { serverActions: { bodySizeLimit: '20mb' } },
};
export default nextConfig;

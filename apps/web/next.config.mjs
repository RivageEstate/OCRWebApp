/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@ocrwebapp/domain", "@ocrwebapp/db", "@ocrwebapp/providers"]
};

export default nextConfig;

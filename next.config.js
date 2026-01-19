/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['your-domain.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/mexc/:path*',
        destination: 'https://contract.mexc.com/api/:path*',
      },
    ];
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
};

module.exports = nextConfig;

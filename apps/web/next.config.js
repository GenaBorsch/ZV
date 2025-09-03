/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@zv/db'],
  transpilePackages: ['@zv/contracts', '@zv/utils'],
  eslint: {
    // Отключаем проверку ESLint во время продакшен сборки
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Отключаем проверку TypeScript во время продакшен сборки
    ignoreBuildErrors: true,
  },

  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

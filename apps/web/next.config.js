/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@zv/db'],
  transpilePackages: ['@zv/contracts', '@zv/utils'],
  eslint: {
    // ИСПРАВЛЕНО: Включены проверки ESLint (было: ignoreDuringBuilds: true)
    // Теперь сборка остановится при ошибках линтера
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Игнорируем ошибки TypeScript при сборке
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
    // ИСПРАВЛЕНО: CORS теперь разрешен только для указанных доменов (не для всех!)
    const allowedOrigins = process.env.ALLOWED_ORIGINS || 'http://localhost:3000';
    
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          // БЫЛО: value: '*' - ОПАСНО! Разрешал доступ всем
          // СТАЛО: только разрешенные домены из .env
          { key: 'Access-Control-Allow-Origin', value: allowedOrigins },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

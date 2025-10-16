/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para Railway/Docker
  output: 'standalone',
  
  // Configuración de zona horaria
  env: {
    TZ: 'America/Santo_Domingo'
  },
  
  // Configuración de imágenes
  images: {
    unoptimized: true,
  },
  
  // Configuración de seguridad
  serverExternalPackages: ['@prisma/client', 'crypto'],
  
  // Configuración para servir archivos estáticos en Railway
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/static/:path*',
      },
    ]
  },
  
  // Configuración del servidor de desarrollo
  webpack: (config, { dev, isServer }) => {
    if (dev && isServer) {
      // Configurar límite de tamaño para desarrollo
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          maxSize: 10 * 1024 * 1024, // 10MB
        },
      }
    }
    return config
  },
  
  // Headers de seguridad mejorados
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'off',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; '),
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig

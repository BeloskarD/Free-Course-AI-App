/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['lucide-react'],
  allowedDevOrigins: [
    '192.168.0.219',
    '192.168.0.219:3000',
    '192.168.0.219.nip.io',
    '192.168.0.219.nip.io:3000',
    'localhost:3000'
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'zeeklect.com',
      },
      {
        protocol: 'https',
        hostname: '*.zeeklect.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'fastly.picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        '192.168.0.219',
        '192.168.0.219:3000',
        '192.168.0.219:3001',
        'http://192.168.0.219:3000',
        'http://192.168.0.219:3001',
        'http://192.168.0.219.nip.io:3000',
        'http://192.168.0.219.nip.io:3001',
        '192.168.0.219.nip.io:3000',
        '192.168.0.219.nip.io:3001',
        'localhost:3000',
        'localhost:3001',
        'http://localhost:3000',
        'http://localhost:3001'
      ]
    }
  }
};

export default nextConfig;

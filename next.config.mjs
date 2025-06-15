import path from 'path'
import { fileURLToPath } from 'url'

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */

await import("./src/env.mjs");

// ESM-compatible path resolution
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,

  /**
   * 🛡️ Hydration และ Performance Optimizations
   */
  experimental: {
    // ปรับปรุงการ hydrate เพื่อลด hydration mismatch
    optimizePackageImports: ['date-fns', 'date-fns-tz', 'zod'],
    // เปิดใช้ optimized loading
    optimizeServerReact: true,
  },

  /**
   * 🔧 TypeScript และ Path Mapping Support
   */
  typescript: {
    // Ignore build errors สำหรับ legacy scripts
    ignoreBuildErrors: false,
  },

  /**
   * 🛡️ Development Configuration  
   */
  ...(process.env.NODE_ENV === 'development' && {
    // ล้างค่า asset prefix สำหรับ development
    assetPrefix: '',
    basePath: '',
    // กำหนด dev indicators
    devIndicators: {
      position: 'bottom-right',
    },
    // Development: อนุญาต localhost และ local IPs
    allowedDevOrigins: ['localhost', '127.0.0.1', '.localhost'],
  }),

  /**
   * 🛡️ Production Configuration
   */
  ...(process.env.NODE_ENV === 'production' && {
    // Production: อนุญาต production domain
    allowedDevOrigins: ["*.your-app.example.com"],
  }),
  
  output: "standalone",
  
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'profile.line-scdn.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  /**
   * 🔧 Webpack Configuration สำหรับ Alias Paths และ Optimization
   */
  webpack: (config, { isServer, dev }) => {
    // 📁 Absolute imports และ alias paths ใหม่
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/utils': path.resolve(__dirname, './src/lib/utils'),
      '@/types': path.resolve(__dirname, './src/lib/types'),
      '@/constants': path.resolve(__dirname, './src/lib/constants'),
      '@/auth': path.resolve(__dirname, './src/lib/auth'),
      '@/database': path.resolve(__dirname, './src/lib/database'),
      '@/validation': path.resolve(__dirname, './src/lib/validation'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/app': path.resolve(__dirname, './src/app'),
    }

    // Development HMR configuration
    if (dev && !isServer) {
      // กำหนด HMR เพื่อป้องกัน WebSocket connection issues
      config.devtool = 'eval-source-map'
      
      if (config.devServer) {
        config.devServer.allowedHosts = ['localhost', '127.0.0.1', '.localhost']
        config.devServer.host = 'localhost'
        config.devServer.port = 4325
      }
    }

    // 🎯 Webpack optimizations สำหรับ hydration
    if (isServer) {
      config.plugins = [...config.plugins]
    }

    // 📁 Exclude legacy scripts และ test files จาก build
    config.module.rules.push({
      test: /scripts\/legacy\/.*\.ts$/,
      use: 'ignore-loader'
    })

    return config
  },

  /**
   * App Router is now enabled, i18n config commented out.
   * @see https://github.com/vercel/next.js/issues/41980
   */
  // i18n: {
  //   locales: ["en"],
  //   defaultLocale: "en",
  // },

  // 🔧 Compiler options เพื่อลด hydration issues
  compiler: {
    // ลบ console.log ใน production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  /**
   *  Bundle Analyzer (เปิดเมื่อต้องการ)
   */
  // bundleAnalyzer: {
  //   enabled: process.env.ANALYZE === 'true',
  // },
};


export default config;
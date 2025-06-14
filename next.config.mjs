/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */

await import("./src/env.mjs");

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
   * 🛡️ Development Configuration  
   */
  ...(process.env.NODE_ENV === 'development' && {
    // ล้างค่า asset prefix สำหรับ development
    assetPrefix: '',
    basePath: '',
    // Allow cross-origin requests from production domain
    allowedDevOrigins: ['https://line-login.midseelee.com'],
    // กำหนด dev indicators (แก้ไข warning)
    devIndicators: {
      position: 'bottom-right',
    },
  }),

  /**
   * 🔧 Development Server Configuration
   */
  ...(process.env.NODE_ENV === 'development' && {
    // Block cross-origin requests from production
    allowedDevOrigins: [],
    // Webpack configuration for HMR
    webpack: (config, { dev, isServer }) => {
      if (dev && !isServer) {
        // กำหนด HMR สำหรับ localhost
        config.devtool = 'eval-source-map'
        
        // Configure webpack dev middleware
        if (config.devServer) {
          config.devServer.allowedHosts = ['localhost', '127.0.0.1']
          config.devServer.host = 'localhost'
          config.devServer.port = 4325
        }
      }
      return config
    },
  }),

  /**
   * App Router is now enabled, i18n config commented out.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   */
  // i18n: {
  //   locales: ["en"],
  //   defaultLocale: "en",
  // },
  
  // 🛡️ Security และ CORS configuration
  ...(process.env.NODE_ENV === 'development' ? {
    // Development: อนุญาต localhost
    allowedDevOrigins: ['localhost', '127.0.0.1'],
  } : {
    // Production: อนุญาต production domain
    allowedDevOrigins: ["*.line-login.midseelee.com"],
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
   * 🔧 Webpack Configuration สำหรับ Hydration และ HMR
   */
  webpack: (config, { isServer, dev }) => {
    // Development configuration
    if (dev && !isServer) {
      // กำหนด HMR เพื่อป้องกัน WebSocket connection issues
      if (config.devServer) {
        config.devServer.allowedHosts = ['localhost', '127.0.0.1', '.localhost']
      }
    }

    // 🎯 Webpack optimizations สำหรับ hydration
    if (isServer) {
      config.plugins = [...config.plugins]
    }

    return config
  },

  // 🔧 Compiler options เพื่อลด hydration issues
  compiler: {
    // ลบ console.log ใน production
    removeConsole: process.env.NODE_ENV === 'production',
  },
};


export default config;
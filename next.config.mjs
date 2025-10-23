import path from "path";
import { fileURLToPath } from "url";

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */

await import("./src/env.mjs");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["date-fns", "date-fns-tz", "zod"],
    optimizeServerReact: true,
    // Enhanced prefetching and routing optimizations
    ppr: false, // Partial Prerendering (experimental)
  },
  // Turbopack configuration (stable in Next.js 16+)
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
    resolveAlias: {
      "@": "./src",
      "@/app": "./src/app",
      "@/auth": "./src/lib/auth",
      "@/components": "./src/components",
      "@/constants": "./src/lib/constants",
      "@/database": "./src/lib/database",
      "@/features": "./src/features",
      "@/hooks": "./src/hooks",
      "@/lib": "./src/lib",
      "@/types": "./src/lib/types",
      "@/utils": "./src/lib/utils",
      "@/validation": "./src/lib/validation",
    },
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  ...(process.env.NODE_ENV === "development"
    ? {
        assetPrefix: "",
        basePath: "",
        devIndicators: { position: "bottom-right" },
        allowedDevOrigins: ["localhost", "127.0.0.1", ".localhost"],
      }
    : {}),
  ...(process.env.NODE_ENV === "production"
    ? {
        allowedDevOrigins: ["*.your-app.example.com"],
      }
    : {}),
  output: "standalone", // Enable standalone for Docker builds
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "profile.line-scdn.net",
        port: "",
        pathname: "/**",
      },
    ],
  },
  webpack: (config, { isServer, dev }) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "./src"),
      "@/app": path.resolve(__dirname, "./src/app"),
      "@/auth": path.resolve(__dirname, "./src/lib/auth"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/constants": path.resolve(__dirname, "./src/lib/constants"),
      "@/database": path.resolve(__dirname, "./src/lib/database"),
      "@/features": path.resolve(__dirname, "./src/features"),
      "@/hooks": path.resolve(__dirname, "./src/hooks"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      "@/types": path.resolve(__dirname, "./src/lib/types"),
      "@/utils": path.resolve(__dirname, "./src/lib/utils"),
      "@/validation": path.resolve(__dirname, "./src/lib/validation"),
    };

    // Fix canvas module issues for chartjs-node-canvas
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("canvas");
      // Make sharp external to prevent webpack bundling issues
      config.externals.push("sharp");
    }
    if (dev && !isServer) {
      if (config.devServer) {
        const allowedFromEnv = process.env.ALLOWED_DOMAINS
          ? process.env.ALLOWED_DOMAINS.split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : ["localhost", "127.0.0.1", ".localhost"];
        config.devServer.allowedHosts = allowedFromEnv;
        config.devServer.host = "localhost";
        config.devServer.port = 4325;
      }
    }
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /scripts\/legacy\/.*\.ts$/,
      use: "ignore-loader",
    });
    config.module.rules.push({ test: /tests\/.*/, use: "ignore-loader" });
    config.module.rules.push({
      test: /\.test\.(ts|tsx)$/,
      use: "ignore-loader",
    });

    // Suppress webpack warnings for chartjs-node-canvas
    config.ignoreWarnings = config.ignoreWarnings || [];
    config.ignoreWarnings.push(
      /Critical dependency: the request of a dependency is an expression/,
    );

    return config;
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default config;

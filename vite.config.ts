import { defineConfig, loadEnv } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

function normalizeHost(value: string | undefined) {
  const input = value?.trim();

  if (!input) {
    return null;
  }

  try {
    return new URL(input).hostname;
  } catch {
    return (
      input
        .replace(/^https?:\/\//, "")
        .split("/")[0]
        ?.split(":")[0] ?? null
    );
  }
}

function getAllowedHosts(env: Record<string, string>) {
  const envHosts = (env.VITE_ALLOWED_HOSTS ?? env.ALLOWED_DOMAINS ?? "")
    .split(",")
    .map((value) => normalizeHost(value));

  const urlHosts = [
    env.APP_URL,
    env.FRONTEND_URL,
    env.APP_DOMAIN,
    env.HOSTNAME,
  ].map((value) => normalizeHost(value));

  return Array.from(
    new Set(
      ["localhost", "127.0.0.1", ...envHosts, ...urlHosts].filter(
        (value): value is string => Boolean(value),
      ),
    ),
  );
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const allowedHosts = getAllowedHosts(env);

  return {
    define: {
      __APP_URL__: JSON.stringify(env.APP_URL ?? env.FRONTEND_URL ?? ""),
    },
    plugins: [devtools(), tailwindcss(), tanstackStart(), viteReact()],
    preview: {
      allowedHosts,
    },
    resolve: {
      alias: {
        "@": path.resolve(dirname, "src"),
      },
      tsconfigPaths: true,
    },
    server: {
      allowedHosts,
    },
  };
});

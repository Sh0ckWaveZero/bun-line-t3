#!/usr/bin/env bun

/**
 * 🚀 Simple Dev Server with Process Lock
 * ป้องกันการรัน bun run dev ซ้ำ
 */

import { spawn } from "child_process";
import { withProcessLock } from "./simple-lock";

async function startDevServer() {
  console.log("🚀 Starting TanStack Start development server...");
  console.log("🌐 Running Vite dev server on http://localhost:4325");

  const devProcess = spawn("bun", ["run", "dev"], {
    stdio: "inherit",
    env: { ...process.env, PORT: "4325" },
  });

  // Handle process cleanup
  const cleanup = () => {
    console.log("\n🛑 Stopping development server...");
    devProcess.kill("SIGTERM");
    process.exit(0);
  };

  // Handle Ctrl+C
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  // Wait for main dev process to end
  return new Promise<void>((resolve, reject) => {
    devProcess.on("close", (code) => {
      if (code === 0) {
        console.log("✅ Development server stopped");
        resolve();
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });

    devProcess.on("error", (error) => {
      console.error("❌ Failed to start development server:", error);
      reject(error);
    });
  });
}

// Main execution with process lock
await withProcessLock("dev-server", startDevServer);

#!/usr/bin/env bun

/**
 * 🚀 Simple Dev Server with Process Lock
 * ป้องกันการรัน bun run dev ซ้ำ
 */

import { spawn } from "child_process";
import { withProcessLock } from "./simple-lock";

async function startDevServer() {
  console.log("🚀 Starting development server...");

  // Start Tailwind watch process
  const tailwindProcess = spawn("bun", ["run", "tailwind:watch"], {
    stdio: "inherit",
    env: process.env,
  });

  const devProcess = spawn("bun", ["run", "dev:basic"], {
    stdio: "inherit",
    env: { ...process.env, PORT: "4325" },
  });

  // Handle Ctrl+C
  process.on("SIGINT", () => {
    console.log("\n🛑 Stopping development server...");
    tailwindProcess.kill("SIGTERM");
    devProcess.kill("SIGTERM");
    process.exit(0);
  });

  // Wait for process to end
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

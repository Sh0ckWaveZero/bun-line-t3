#!/usr/bin/env bun

/**
 * 🚀 Simple Dev Server with Process Lock
 * ป้องกันการรัน bun run dev ซ้ำ
 */

import { spawn } from "child_process";
import { withProcessLock } from "./simple-lock";

async function startDevServer() {
  console.log("🚀 Starting development server...");
  console.log("📦 Starting Tailwind CSS watch mode...");

  // Start Tailwind watch process
  const tailwindProcess = spawn("bun", ["run", "tailwind:watch"], {
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });

  // Handle Tailwind output
  tailwindProcess.stdout?.on("data", (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`🎨 Tailwind: ${output}`);
    }
  });

  tailwindProcess.stderr?.on("data", (data) => {
    const error = data.toString().trim();
    if (error && !error.includes("Done in")) {
      console.log(`🎨 Tailwind: ${error}`);
    }
  });

  // Small delay to let Tailwind start
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log("🌐 Starting Next.js development server...");
  const devProcess = spawn("bun", ["run", "dev:basic"], {
    stdio: "inherit",
    env: { ...process.env, PORT: "4325" },
  });

  // Handle process cleanup
  const cleanup = () => {
    console.log("\n🛑 Stopping development server...");
    tailwindProcess.kill("SIGTERM");
    devProcess.kill("SIGTERM");
    process.exit(0);
  };

  // Handle Ctrl+C
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  // Handle Tailwind process errors
  tailwindProcess.on("error", (error) => {
    console.error("❌ Tailwind watch failed:", error.message);
  });

  // Wait for main dev process to end
  return new Promise<void>((resolve, reject) => {
    devProcess.on("close", (code) => {
      tailwindProcess.kill("SIGTERM");
      if (code === 0) {
        console.log("✅ Development server stopped");
        resolve();
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });

    devProcess.on("error", (error) => {
      console.error("❌ Failed to start development server:", error);
      tailwindProcess.kill("SIGTERM");
      reject(error);
    });
  });
}

// Main execution with process lock
await withProcessLock("dev-server", startDevServer);

import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

function deploy(scenario: string, hasPrevious = true) {
  const directory = mkdtempSync(join(tmpdir(), "deployment-test-"));
  const calls = join(directory, "calls");
  writeFileSync(
    join(directory, "docker"),
    `#!/bin/bash
printf '%s\n' "$*" >> "$CALLS"
case "$*" in
  *"up --help") echo --wait-timeout ;;
  "inspect "*)
    [[ "$HAS_PREVIOUS" == true ]] || exit 1
    echo sha256:previous ;;
  *" build "*) [[ "$SCENARIO" != build-failure ]] || exit 1 ;;
  *"run --rm"*) [[ "$SCENARIO" != migration-failure ]] || exit 1 ;;
  *"up -d"*)
    if [[ "$APP_IMAGE_TAG" != rollback-* && "$SCENARIO" == health-failure ]]; then exit 1; fi
    if [[ "$APP_IMAGE_TAG" == rollback-* && "$SCENARIO" == rollback-failure ]]; then exit 1; fi ;;
esac
`,
    { mode: 0o755 },
  );
  writeFileSync(
    join(directory, "curl"),
    `#!/bin/bash
printf '%s\n' "curl $*" >> "$CALLS"
[[ "$SCENARIO" != http-failure && "$SCENARIO" != rollback-failure ]]
`,
    { mode: 0o755 },
  );
  const environment = {
    ...process.env,
    PATH: `${directory}:${process.env.PATH}`,
    CALLS: calls,
    SCENARIO: scenario,
    HAS_PREVIOUS: String(hasPrevious),
    RELEASE_TAG: "test-release",
    PORT: "14567",
  };
  for (const key of [
    "DATABASE_URL",
    "APP_URL",
    "AUTH_SECRET",
    "FRONTEND_URL",
    "JWT_SECRET",
    "INTERNAL_API_KEY",
    "CRON_SECRET",
    "LINE_CLIENT_ID",
    "LINE_CLIENT_SECRET",
    "LINE_LOGIN_CHANNEL_ID",
    "LINE_LOGIN_CHANNEL_SECRET",
    "LINE_CHANNEL_ACCESS",
    "LINE_CHANNEL_SECRET",
    "AQICN_TOKEN",
    "CMC_API_KEY",
    "OPENAI_API_KEY",
    "APP_DOMAIN",
    "ALLOWED_DOMAINS",
  ]) {
    Object.assign(environment, { [key]: "test-value" });
  }
  if (scenario === "missing-secret")
    Object.assign(environment, { AUTH_SECRET: "" });
  try {
    const result = Bun.spawnSync(
      ["bash", resolve("scripts/devops/deploy.sh")],
      { env: environment },
    );
    let commands = "";
    try {
      commands = readFileSync(calls, "utf8");
    } catch {
      /* ไม่มีการเรียก Docker */
    }
    return {
      exitCode: result.exitCode,
      commands,
      output: result.stdout.toString() + result.stderr.toString(),
    };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

describe("ขั้นตอน deploy", () => {
  test("ตรวจ secrets ก่อนเรียก Docker", () => {
    const result = deploy("missing-secret");
    expect(result.exitCode).not.toBe(0);
    expect(result.commands).toBe("");
    expect(result.output).not.toContain("test-value");
  });
  for (const scenario of ["build-failure", "migration-failure"]) {
    test(`${scenario} ไม่เปลี่ยนบริการเดิม`, () => {
      const result = deploy(scenario);
      expect(result.exitCode).not.toBe(0);
      expect(result.commands).not.toContain("up -d");
    });
  }
  test("รัน migration ก่อน up และตรวจ port ที่กำหนด", () => {
    const result = deploy("success");
    expect(result.exitCode).toBe(0);
    expect(result.commands.indexOf("run --rm --no-deps migrate")).toBeLessThan(
      result.commands.indexOf("up -d"),
    );
    expect(result.commands).toContain(
      "--no-build --wait --wait-timeout 240 app cron",
    );
    expect(result.commands).toContain("127.0.0.1:14567");
    expect(result.commands).not.toContain("down");
    expect(result.commands).not.toContain("prune");
  });
  for (const scenario of ["health-failure", "http-failure"]) {
    test(`${scenario} กู้ image เดิมและยังคืน failure`, () => {
      const result = deploy(scenario);
      expect(result.exitCode).not.toBe(0);
      expect(result.commands.match(/up -d/g)?.length).toBe(2);
      expect(result.output).toContain("กู้ image เดิมแล้ว");
    });
  }
  test("rollback ล้มเหลวไม่รายงานสำเร็จ", () => {
    const result = deploy("rollback-failure");
    expect(result.exitCode).not.toBe(0);
    expect(result.output).toContain("กู้บริการไม่สำเร็จ");
  });
  test("deploy ครั้งแรกไม่มี image เดิมไม่อ้างว่ากู้คืนแล้ว", () => {
    const result = deploy("health-failure", false);
    expect(result.exitCode).not.toBe(0);
    expect(result.commands.match(/up -d/g)?.length).toBe(1);
    expect(result.output).toContain("ไม่มี image เดิม");
  });
});

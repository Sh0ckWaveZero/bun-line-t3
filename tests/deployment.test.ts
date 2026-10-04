import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

function deploy(
  scenario: string,
  hasPrevious = true,
  staged = false,
  forceRebuild = false,
) {
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
  *" build "*)
    [[ "$SCENARIO" != build-failure ]] || exit 1
    if [[ "$SCENARIO" == cron-build-failure && "$*" == *" cron" ]]; then exit 1; fi ;;
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
    FORCE_REBUILD: String(forceRebuild),
    GITHUB_OUTPUT: join(directory, "outputs"),
    PREVIOUS_APP_IMAGE: "",
    PREVIOUS_CRON_IMAGE: "",
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
    let exitCode = 0;
    let output = "";
    const phases = staged
      ? ["preflight", "backup", "build", "migrate", "release"]
      : ["all"];
    for (const phase of phases) {
      const result = Bun.spawnSync(
        [
          "bash",
          resolve("scripts/devops/deploy.sh"),
          ...(staged ? [phase] : []),
        ],
        { env: environment },
      );
      exitCode = result.exitCode;
      output += result.stdout.toString() + result.stderr.toString();
      if (exitCode !== 0) break;
      if (phase === "backup") {
        const outputs = readFileSync(environment.GITHUB_OUTPUT, "utf8");
        for (const line of outputs.trim().split("\n")) {
          const separator = line.indexOf("=");
          const key = line.slice(0, separator);
          const value = line.slice(separator + 1);
          if (key === "previous_app") environment.PREVIOUS_APP_IMAGE = value;
          if (key === "previous_cron") environment.PREVIOUS_CRON_IMAGE = value;
        }
      }
    }
    let commands = "";
    try {
      commands = readFileSync(calls, "utf8");
    } catch {
      /* ไม่มีการเรียก Docker */
    }
    return {
      exitCode,
      commands,
      output,
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

describe("แยกขั้นตอน deploy เป็นคนละ shell", () => {
  test("build ทีละ service ก่อน migration และ release", () => {
    const result = deploy("success", true, true);
    expect(result.exitCode).toBe(0);
    const builds = result.commands
      .split("\n")
      .filter((line) => line.includes(" build "));
    expect(builds.map((line) => line.split(" ").at(-1))).toEqual([
      "app",
      "cron",
      "migrate",
    ]);
    expect(result.commands.indexOf("build migrate")).toBeLessThan(
      result.commands.indexOf("run --rm"),
    );
    expect(result.commands.indexOf("run --rm")).toBeLessThan(
      result.commands.indexOf("up -d"),
    );
  });
  test("force rebuild ส่ง --pull --no-cache ให้ทุก service", () => {
    const result = deploy("success", true, true, true);
    expect(result.exitCode).toBe(0);
    for (const service of ["app", "cron", "migrate"]) {
      expect(result.commands).toContain(`build --pull --no-cache ${service}`);
    }
  });
  for (const scenario of [
    "missing-secret",
    "build-failure",
    "cron-build-failure",
    "migration-failure",
  ]) {
    test(`${scenario} หยุดก่อนเปลี่ยนบริการ`, () => {
      const result = deploy(scenario, true, true);
      expect(result.exitCode).not.toBe(0);
      expect(result.commands).not.toContain("up -d");
      if (scenario === "cron-build-failure")
        expect(result.commands).not.toContain("build migrate");
    });
  }
  for (const scenario of [
    "health-failure",
    "http-failure",
    "rollback-failure",
  ]) {
    test(`${scenario} ใช้ image จาก backup step และยังคืน failure`, () => {
      const result = deploy(scenario, true, true);
      expect(result.exitCode).not.toBe(0);
      expect(result.commands.match(/up -d/g)?.length).toBe(2);
      expect(result.output).toContain(
        scenario === "rollback-failure"
          ? "กู้บริการไม่สำเร็จ"
          : "กู้ image เดิมแล้ว",
      );
    });
  }
  test("ไม่มี image เดิมส่ง output ว่างและไม่พยายาม rollback", () => {
    const result = deploy("health-failure", false, true);
    expect(result.exitCode).not.toBe(0);
    expect(result.commands.match(/up -d/g)?.length).toBe(1);
    expect(result.output).toContain("ไม่มี image เดิม");
  });
});

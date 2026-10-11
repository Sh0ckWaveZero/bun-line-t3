import { expect, test } from "bun:test";

test("reminders forward available weather and skip fetching when unnecessary", () => {
  const script = `
    import { expect, mock } from "bun:test";
    const OriginalDate = globalThis.Date;
    globalThis.Date = class extends OriginalDate {
      constructor(...args) {
        super(...(args.length ? args : ["2026-10-10T23:30:00Z"]));
      }
    };
    const state = { recipients: ["user1", "user2"], weather: "กรุงเทพฯ มีฝน", calls: 0, options: undefined, pushes: 0 };
    const env = { OPENAI_API_KEY: "test-key" };
    mock.module("@/env.mjs", () => ({ env }));
    mock.module("@/features/attendance/services/attendance.server", () => ({
      attendanceService: { getActiveLineUserIdsForCheckinReminder: async () => state.recipients }
    }));
    mock.module("@/features/weather/services/bangkok-weather.server", () => ({
      getBangkokCurrentWeather: async () => { state.calls++; return state.weather; }
    }));
    mock.module("@/lib/constants/checkin-reminder-messages", () => ({
      getCheckInMessage: async (options) => { state.options = options; return "เช็คอินกันนะ"; }
    }));
    mock.module("@/lib/utils/line-push", () => ({
      sendPushMessage: async (_id, messages) => {
        state.pushes++;
        expect(messages[0].text).toBe("เช็คอินกันนะ");
        expect(messages[1].template.actions[0].data).toBe("action=checkin");
      }
    }));
    const { sendCheckInReminders } = await import("@/lib/utils/cron-reminder-sender");
    const result = await sendCheckInReminders("2026-10-11");
    expect(state.calls).toBe(1);
    expect(state.options.context.weather).toBe("กรุงเทพฯ มีฝน");
    expect(state.options.context.timeOfDay).toBe("morning");
    expect(state.options.context.dayOfWeek).toBe("วันอาทิตย์");
    expect(result.sentCount).toBe(2);
    expect(state.pushes).toBe(2);
    state.weather = undefined;
    await sendCheckInReminders("2026-10-11");
    expect(state.calls).toBe(2);
    expect(Object.hasOwn(state.options.context, "weather")).toBe(false);
    env.OPENAI_API_KEY = "";
    await sendCheckInReminders("2026-10-11");
    expect(state.calls).toBe(2);
    expect(state.options.useAI).toBe(false);
    expect(Object.hasOwn(state.options.context, "weather")).toBe(false);
    env.OPENAI_API_KEY = "test-key";
    state.recipients = [];
    const emptyResult = await sendCheckInReminders("2026-10-11");
    expect(state.calls).toBe(2);
    expect(emptyResult.totalUsers).toBe(0);
  `;
  const result = Bun.spawnSync([process.execPath, "--eval", script], {
    cwd: process.cwd(),
    stdout: "pipe",
    stderr: "pipe",
  });
  expect(result.stderr.toString()).toBe("");
  expect(result.exitCode).toBe(0);
});

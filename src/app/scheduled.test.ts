import { describe, it, expect, vi, beforeEach } from "vitest";
import worker from "../index";

describe("Scheduled Handler", () => {
  let env: any;
  let ctx: any;

  beforeEach(() => {
    env = {
      DB: {
        prepare: vi.fn().mockReturnThis(),
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: [] }),
        first: vi.fn(),
      },
    };
    ctx = {
      waitUntil: vi.fn(),
    };
  });

  it("should trigger due reminders", async () => {
    const scheduledEvent = {
      scheduledTime: Date.now(),
      cron: "* * * * *",
      noWait: () => {},
    } as any;

    await worker.scheduled(scheduledEvent, env, ctx);

    expect(env.DB.prepare).toHaveBeenCalledWith(expect.stringContaining("SELECT r.user_id"));
    expect(ctx.waitUntil).toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReminderService } from "./reminder.service";
import { AppError } from "../types/errors";

describe("ReminderService", () => {
  let repository: any;
  let service: ReminderService;

  beforeEach(() => {
    repository = {
      getSettings: vi.fn(),
      upsertSettings: vi.fn(),
      getReminders: vi.fn(),
      addReminder: vi.fn(),
      deleteReminder: vi.fn(),
      getAllDueReminders: vi.fn(),
    };
    service = new ReminderService(repository);
  });

  it("should return reminder data, creating settings if missing", async () => {
    const userId = "user1";
    repository.getSettings.mockResolvedValue(null);
    repository.upsertSettings.mockResolvedValue({ user_id: userId, enabled: false });
    repository.getReminders.mockResolvedValue([]);

    const result = await service.getReminderData(userId);

    expect(repository.upsertSettings).toHaveBeenCalledWith(userId, false);
    expect(result.settings.enabled).toBe(false);
    expect(result.reminders).toEqual([]);
  });

  it("should add a reminder if it doesn't exist", async () => {
    const userId = "user1";
    const time = "08:00";
    repository.getReminders.mockResolvedValue([]);
    repository.getSettings.mockResolvedValue({ enabled: true });

    await service.addReminder(userId, time);

    expect(repository.addReminder).toHaveBeenCalledWith(userId, time);
  });

  it("should throw error if adding a duplicate reminder time", async () => {
    const userId = "user1";
    const time = "08:00";
    repository.getReminders.mockResolvedValue([{ time }]);

    await expect(service.addReminder(userId, time)).rejects.toThrow(AppError);
  });

  it("should throw error if deleting non-existent reminder", async () => {
    const userId = "user1";
    repository.deleteReminder.mockResolvedValue(false);

    await expect(service.deleteReminder(userId, "invalid-id")).rejects.toThrow(AppError);
  });

  it("should trigger reminders that match the current time", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    repository.getAllEnabledReminders = vi
      .fn()
      .mockResolvedValue([{ user_id: "u1", time: "08:00", timezone: "UTC" }]);

    const { Temporal } = await import("temporal-polyfill");
    const now = Temporal.ZonedDateTime.from("2024-01-01T08:00:00[UTC]");
    await service.triggerReminders(now);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("u1"));
    logSpy.mockRestore();
  });

  it("should not trigger reminders that do not match the current time", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    repository.getAllEnabledReminders = vi
      .fn()
      .mockResolvedValue([{ user_id: "u1", time: "09:00", timezone: "UTC" }]);

    const { Temporal } = await import("temporal-polyfill");
    const now = Temporal.ZonedDateTime.from("2024-01-01T08:00:00[UTC]");
    await service.triggerReminders(now);

    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it("should log error and continue when a reminder throws", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    repository.getAllEnabledReminders = vi
      .fn()
      .mockResolvedValue([{ user_id: "u1", time: "08:00", timezone: "Bad/Timezone" }]);

    const { Temporal } = await import("temporal-polyfill");
    const now = Temporal.ZonedDateTime.from("2024-01-01T08:00:00[UTC]");
    await service.triggerReminders(now);

    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining("u1"), expect.anything());
    errSpy.mockRestore();
  });

  it("should update reminder settings", async () => {
    repository.upsertSettings.mockResolvedValue({ user_id: "user1", enabled: true });
    const result = await service.updateSettings("user1", true);
    expect(result.enabled).toBe(true);
  });
});

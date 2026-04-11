import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReminderRepository } from "./reminder.repository";

describe("ReminderRepository", () => {
  let db: any;
  let repository: ReminderRepository;

  beforeEach(() => {
    db = {
      prepare: vi.fn().mockReturnThis(),
      bind: vi.fn().mockReturnThis(),
      first: vi.fn(),
      run: vi.fn(),
      all: vi.fn(),
    };
    repository = new ReminderRepository(db);
  });

  it("should get reminder settings", async () => {
    const userId = "user1";
    const row = { user_id: userId, enabled: 1 };
    db.first.mockResolvedValue(row);

    const result = await repository.getSettings(userId);
    expect(result).toEqual({ user_id: userId, enabled: true });
    expect(db.prepare).toHaveBeenCalledWith("SELECT * FROM reminder_settings WHERE user_id = ?");
  });

  it("should upsert reminder settings", async () => {
    const userId = "user1";
    db.first.mockResolvedValue({ user_id: userId, enabled: 1 });

    const result = await repository.upsertSettings(userId, true);
    expect(result.enabled).toBe(true);
    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO reminder_settings"));
  });

  it("should get all reminders for a user", async () => {
    const userId = "user1";
    const reminders = [{ id: "1", user_id: userId, time: "08:00" }];
    db.all.mockResolvedValue({ results: reminders });

    const result = await repository.getReminders(userId);
    expect(result).toEqual(reminders);
  });

  it("should add a reminder", async () => {
    const userId = "user1";
    const time = "09:00";
    db.first.mockResolvedValue({ id: "uuid", user_id: userId, time });

    const result = await repository.addReminder(userId, time);
    expect(result.time).toBe(time);
    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO reminders"));
  });

  it("should delete a reminder", async () => {
    db.run.mockResolvedValue({ meta: { changes: 1 } });

    const result = await repository.deleteReminder("id", "user1");
    expect(result).toBe(true);
  });
});

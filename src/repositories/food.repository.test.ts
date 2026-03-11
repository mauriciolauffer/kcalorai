import { describe, it, expect, vi, beforeEach } from "vitest";
import { FoodRepository } from "./food.repository";

describe("FoodRepository", () => {
  let db: any;
  let repository: FoodRepository;

  beforeEach(() => {
    db = {
      prepare: vi.fn().mockReturnThis(),
      bind: vi.fn().mockReturnThis(),
      first: vi.fn(),
      run: vi.fn(),
      all: vi.fn(),
    };
    repository = new FoodRepository(db);
  });

  it("should create a food log", async () => {
    const logData = {
      user_id: "user1",
      food_id: "food1",
      name: "Apple",
      date: "2023-10-27",
      meal: "snack" as const,
      servings: 1,
      calories: 95,
      protein_g: 0.5,
      fat_g: 0.3,
      carbs_g: 25,
    };
    const expectedResult = { ...logData, id: "uuid", created_at: "now", updated_at: "now" };
    db.first.mockResolvedValue(expectedResult);

    const result = await repository.createLog(logData);

    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO food_logs"));
    expect(result).toEqual(expectedResult);
  });

  it("should update a food log", async () => {
    const logId = "log1";
    const userId = "user1";
    const updateData = { calories: 100 };
    const expectedResult = { id: logId, user_id: userId, calories: 100 };
    db.first.mockResolvedValue(expectedResult);

    const result = await repository.updateLog(logId, userId, updateData);

    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining("UPDATE food_logs SET"));
    expect(result).toEqual(expectedResult);
  });

  it("should delete a food log", async () => {
    const logId = "log1";
    const userId = "user1";
    db.run.mockResolvedValue({ meta: { changes: 1 } });

    const success = await repository.deleteLog(logId, userId);

    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining("DELETE FROM food_logs"));
    expect(success).toBe(true);
  });

  it("should get logs by date", async () => {
    const userId = "user1";
    const date = "2023-10-27";
    const expectedLogs = [{ id: "log1", name: "Apple" }];
    db.all.mockResolvedValue({ results: expectedLogs });

    const results = await repository.getLogsByDate(userId, date);

    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining("SELECT * FROM food_logs WHERE user_id = ? AND date = ?"));
    expect(results).toEqual(expectedLogs);
  });
});

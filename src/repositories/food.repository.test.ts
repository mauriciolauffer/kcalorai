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

    expect(db.prepare).toHaveBeenCalledWith(
      expect.stringContaining("SELECT * FROM food_logs WHERE user_id = ? AND date = ?"),
    );
    expect(results).toEqual(expectedLogs);
  });

  it("should search foods by name with partial match", async () => {
    const userId = "user1";
    const query = "ppl";
    const expectedFoods = [{ id: "f1", name: "Apple" }];
    db.all.mockResolvedValue({ results: expectedFoods });

    const results = await repository.searchFoods(query, userId);

    expect(db.prepare).toHaveBeenCalledWith(
      expect.stringContaining(
        "SELECT * FROM foods WHERE name LIKE ? AND (user_id IS NULL OR user_id = ?)",
      ),
    );
    expect(db.bind).toHaveBeenCalledWith("%ppl%", userId);
    expect(results).toEqual(expectedFoods);
  });

  it("should return both global and user-specific foods in search", async () => {
    const userId = "user1";
    const query = "apple";
    const expectedFoods = [
      { id: "f1", name: "Global Apple", user_id: null },
      { id: "f2", name: "My Apple", user_id: userId },
    ];
    db.all.mockResolvedValue({ results: expectedFoods });

    const results = await repository.searchFoods(query, userId);

    expect(db.bind).toHaveBeenCalledWith("%apple%", userId);
    expect(results).toHaveLength(2);
    expect(results).toEqual(expectedFoods);
  });

  it("should return empty array for empty or whitespace query", async () => {
    const userId = "user1";

    const result1 = await repository.searchFoods("", userId);
    const result2 = await repository.searchFoods("   ", userId);

    expect(result1).toEqual([]);
    expect(result2).toEqual([]);
    expect(db.prepare).not.toHaveBeenCalledWith(expect.stringContaining("SELECT * FROM foods"));
  });

  it("should apply LIMIT 50 to search query", async () => {
    const userId = "user1";
    db.all.mockResolvedValue({ results: [] });

    await repository.searchFoods("apple", userId);

    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining("LIMIT 50"));
  });

  it("should get food by id", async () => {
    const foodId = "f1";
    const userId = "user1";
    const expectedFood = { id: foodId, name: "Apple" };
    db.first.mockResolvedValue(expectedFood);

    const result = await repository.getFoodById(foodId, userId);

    expect(db.prepare).toHaveBeenCalledWith(
      expect.stringContaining(
        "SELECT * FROM foods WHERE id = ? AND (user_id IS NULL OR user_id = ?)",
      ),
    );
    expect(db.bind).toHaveBeenCalledWith(foodId, userId);
    expect(result).toEqual(expectedFood);
  });
});

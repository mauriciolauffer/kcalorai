import { describe, it, expect, vi, beforeEach } from "vitest";
import { FoodService } from "./food.service";
import { FoodRepository } from "../repositories/food.repository";
import { NotFoundError } from "../types/errors";

describe("FoodService", () => {
  let service: FoodService;
  let repository: any;

  beforeEach(() => {
    repository = {
      createLog: vi.fn(),
      updateLog: vi.fn(),
      deleteLog: vi.fn(),
      getLog: vi.fn(),
      getLogsByDate: vi.fn(),
      searchFoods: vi.fn(),
      getFoodById: vi.fn(),
    };
    service = new FoodService(repository as unknown as FoodRepository);
  });

  it("should log a meal", async () => {
    const userId = "user1";
    const data = {
      name: "Apple",
      calories: 95,
      date: "2023-10-27",
      meal: "snack" as const,
    };
    repository.createLog.mockResolvedValue({ id: "log1", ...data, user_id: userId });

    const result = await service.logMeal(userId, data);

    expect(repository.createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: userId,
        name: data.name,
        calories: data.calories,
      }),
    );
    expect(result.id).toBe("log1");
  });

  it("should log a meal with default name if name is missing (Quick Add)", async () => {
    const userId = "user1";
    const data = {
      calories: 500,
      date: "2023-10-27",
      meal: "lunch" as const,
    };
    repository.createLog.mockResolvedValue({
      id: "log1",
      ...data,
      name: "Quick Add",
      user_id: userId,
    });

    const result = await service.logMeal(userId, data);

    expect(repository.createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: userId,
        name: "Quick Add",
        calories: data.calories,
      }),
    );
    expect(result.name).toBe("Quick Add");
  });

  it("should throw NotFoundError if update fails", async () => {
    repository.updateLog.mockRejectedValue(new Error("Fail"));
    await expect(service.updateLog("u1", "l1", { name: "New" })).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError if delete fails", async () => {
    repository.deleteLog.mockResolvedValue(false);
    await expect(service.deleteLog("u1", "l1")).rejects.toThrow(NotFoundError);
  });

  it("should search foods", async () => {
    const userId = "user1";
    const query = "apple";
    const expectedFoods = [{ id: "f1", name: "Apple" }];
    repository.searchFoods.mockResolvedValue(expectedFoods);

    const result = await service.searchFoods(query, userId);

    expect(repository.searchFoods).toHaveBeenCalledWith(query, userId);
    expect(result).toEqual(expectedFoods);
  });

  it("should get food by id", async () => {
    const foodId = "f1";
    const userId = "user1";
    const expectedFood = { id: foodId, name: "Apple" };
    repository.getFoodById.mockResolvedValue(expectedFood);

    const result = await service.getFoodById(foodId, userId);

    expect(repository.getFoodById).toHaveBeenCalledWith(foodId, userId);
    expect(result).toEqual(expectedFood);
  });

  it("should throw NotFoundError if food not found by id", async () => {
    repository.getFoodById.mockResolvedValue(null);
    await expect(service.getFoodById("nonexistent", "user1")).rejects.toThrow(NotFoundError);
  });

  describe("copyLog", () => {
    it("should copy a log to a new date", async () => {
      const userId = "user1";
      const logId = "log1";
      const existingLog = {
        id: logId,
        user_id: userId,
        name: "Apple",
        calories: 95,
        date: "2023-10-27",
        meal: "snack",
        protein_g: 0,
        fat_g: 0,
        carbs_g: 0,
        servings: 1,
        food_id: "f1",
      };
      const newDate = "2023-10-28";

      repository.getLog.mockResolvedValue(existingLog);
      repository.createLog.mockImplementation((data: any) => Promise.resolve({ id: "log2", ...data }));

      const result = await service.copyLog(userId, logId, newDate);

      expect(repository.getLog).toHaveBeenCalledWith(logId, userId);
      expect(repository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          date: newDate,
          name: "Apple",
          calories: 95,
        }),
      );
      expect(result.id).toBe("log2");
      expect(result.date).toBe(newDate);
    });

    it("should throw NotFoundError if log to copy is not found", async () => {
      repository.getLog.mockResolvedValue(null);
      await expect(service.copyLog("u1", "l1")).rejects.toThrow(NotFoundError);
    });
  });
});

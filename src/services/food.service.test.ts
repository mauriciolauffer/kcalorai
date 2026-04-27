import { describe, it, expect, vi, beforeEach } from "vitest";
import { FoodService } from "./food.service";
import { FoodRepository } from "../repositories/food.repository";
import { NotFoundError, ValidationError } from "../types/errors";

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

  it("should scale nutritional values when food_id is provided", async () => {
    const userId = "user1";
    const foodId = "f1";
    const food = {
      id: foodId,
      name: "Apple",
      calories: 100,
      protein_g: 1,
      fat_g: 0.5,
      carbs_g: 25,
      serving_grams: 100,
    };
    const data = {
      food_id: foodId,
      servings: 1.5,
      date: "2023-10-27",
      meal: "snack" as const,
    };
    repository.getFoodById.mockResolvedValue(food);
    repository.createLog.mockImplementation((d: any) => Promise.resolve({ id: "log1", ...d }));

    const result = await service.logMeal(userId, data);

    expect(result.calories).toBe(150); // 100 * 1.5
    expect(result.protein_g).toBe(1.5); // 1 * 1.5
    expect(result.fat_g).toBe(0.8); // 0.5 * 1.5 = 0.75 -> rounded to 1 decimal place = 0.8? actually toFixed(1) gives "0.8" for 0.75
    expect(result.carbs_g).toBe(37.5); // 25 * 1.5
  });

  it("should throw ValidationError for manual entries without calories", async () => {
    const userId = "user1";
    const data = {
      name: "Apple",
      date: "2023-10-27",
      meal: "snack" as const,
    };

    await expect(service.logMeal(userId, data as any)).rejects.toThrow(ValidationError);
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
    repository.getLog.mockResolvedValue(null);
    await expect(service.updateLog("u1", "l1", { name: "New" })).rejects.toThrow(NotFoundError);
  });

  it("should rescale nutritional values on update when servings change for an entry with food_id", async () => {
    const userId = "u1";
    const logId = "l1";
    const foodId = "f1";
    const food = {
      id: foodId,
      name: "Apple",
      calories: 100,
      protein_g: 1,
      fat_g: 0.5,
      carbs_g: 25,
    };
    const existingLog = {
      id: logId,
      user_id: userId,
      food_id: foodId,
      servings: 1,
      calories: 100,
      protein_g: 1,
      fat_g: 0.5,
      carbs_g: 25,
    };

    repository.getLog.mockResolvedValue(existingLog);
    repository.getFoodById.mockResolvedValue(food);
    repository.updateLog.mockImplementation((id: string, uid: string, d: any) =>
      Promise.resolve({ ...existingLog, ...d }),
    );

    const result = await service.updateLog(userId, logId, { servings: 2 });

    expect(result.calories).toBe(200);
    expect(result.protein_g).toBe(2);
    expect(result.fat_g).toBe(1);
    expect(result.carbs_g).toBe(50);
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

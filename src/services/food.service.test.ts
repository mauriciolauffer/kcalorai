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

    expect(repository.createLog).toHaveBeenCalledWith(expect.objectContaining({
      user_id: userId,
      name: data.name,
      calories: data.calories,
    }));
    expect(result.id).toBe("log1");
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
});

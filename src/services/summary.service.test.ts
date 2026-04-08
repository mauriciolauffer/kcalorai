import { describe, it, expect, vi } from "vitest";
import { SummaryService } from "./summary.service";
import { FoodRepository } from "../repositories/food.repository";
import { ProfileRepository } from "../repositories/profile.repository";

describe("SummaryService", () => {
  const mockFoodRepository = {
    getLogsByDate: vi.fn(),
    getLogsByDateRange: vi.fn(),
  } as unknown as FoodRepository;

  const mockProfileRepository = {
    getGoalByDate: vi.fn(),
  } as unknown as ProfileRepository;

  const summaryService = new SummaryService(mockFoodRepository, mockProfileRepository);

  describe("getWeeklySummary", () => {
    it("should calculate weekly averages and daily trends", async () => {
      const userId = "user-1";
      const endDate = "2024-01-07"; // Sunday
      const logs = [
        {
          date: "2024-01-01",
          calories: 1000,
          protein_g: 10,
          fat_g: 10,
          carbs_g: 10,
        },
        {
          date: "2024-01-07",
          calories: 1100,
          protein_g: 20,
          fat_g: 20,
          carbs_g: 20,
        },
      ];

      vi.mocked(mockFoodRepository.getLogsByDateRange).mockResolvedValue(logs as any);

      const summary = await summaryService.getWeeklySummary(userId, endDate);

      expect(summary.days).toHaveLength(7);
      expect(summary.days[0].date).toBe("2024-01-01");
      expect(summary.days[0].calories).toBe(1000);
      expect(summary.days[6].date).toBe("2024-01-07");
      expect(summary.days[6].calories).toBe(1100);

      // Average: (1000 + 0 + 0 + 0 + 0 + 0 + 1100) / 7 = 2100 / 7 = 300
      expect(summary.average.calories).toBe(300);
      // Average macros: (10 + 20) / 7 = 30 / 7 = 4.28... -> 4.3
      expect(summary.average.protein_g).toBe(4.3);
    });
  });
});

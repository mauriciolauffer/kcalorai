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
          date: "2024-01-01",
          calories: 500,
          protein_g: 5,
          fat_g: 5,
          carbs_g: 5,
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

      // Jan 01 (Monday)
      expect(summary.days[0].date).toBe("2024-01-01");
      expect(summary.days[0].calories).toBe(1500); // 1000 + 500
      expect(summary.days[0].protein_g).toBe(15);

      // Jan 02-06 (Empty days)
      for (let i = 1; i < 6; i++) {
        expect(summary.days[i].calories).toBe(0);
      }

      // Jan 07 (Sunday)
      expect(summary.days[6].date).toBe("2024-01-07");
      expect(summary.days[6].calories).toBe(1100);

      // Average: (1500 + 0 + 0 + 0 + 0 + 0 + 1100) / 7 = 2600 / 7 = 371.428... -> 371
      expect(summary.average.calories).toBe(371);
      // Average protein: (15 + 20) / 7 = 35 / 7 = 5
      expect(summary.average.protein_g).toBe(5);
    });

    it("should handle a week with no logs", async () => {
      vi.mocked(mockFoodRepository.getLogsByDateRange).mockResolvedValue([]);

      const summary = await summaryService.getWeeklySummary("user-1", "2024-01-07");

      expect(summary.days).toHaveLength(7);
      expect(summary.average.calories).toBe(0);
      expect(summary.days.every(d => d.calories === 0)).toBe(true);
    });
  });
});

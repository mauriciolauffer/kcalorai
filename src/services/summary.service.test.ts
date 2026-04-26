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

  describe("getDailySummary", () => {
    it("should aggregate calories and macros for a daily summary", async () => {
      const userId = "user-1";
      const date = "2024-01-01";
      const logs = [
        {
          meal: "breakfast",
          calories: 300,
          protein_g: 20.5,
          fat_g: 10.1,
          carbs_g: 30.2,
        },
        {
          meal: "lunch",
          calories: 500,
          protein_g: 30.4,
          fat_g: 15.2,
          carbs_g: 60.3,
        },
      ];
      const goal = {
        daily_calories: 2000,
        protein_g: 150,
        fat_g: 70,
        carbs_g: 200,
      };

      vi.mocked(mockFoodRepository.getLogsByDate).mockResolvedValue(logs as any);
      vi.mocked(mockProfileRepository.getGoalByDate).mockResolvedValue(goal as any);

      const summary = await summaryService.getDailySummary(userId, date);

      expect(summary.date).toBe(date);
      // Aggregated consumed:
      // protein: 20.5 + 30.4 = 50.9
      // fat: 10.1 + 15.2 = 25.3
      // carbs: 30.2 + 60.3 = 90.5
      expect(summary.consumed.calories).toBe(800);
      expect(summary.consumed.protein_g).toBe(50.9);
      expect(summary.consumed.fat_g).toBe(25.3);
      expect(summary.consumed.carbs_g).toBe(90.5);

      // Goal:
      expect(summary.goal).toEqual({
        calories: 2000,
        protein_g: 150,
        fat_g: 70,
        carbs_g: 200,
      });

      // Remaining:
      // protein: 150 - 50.9 = 99.1
      expect(summary.remaining?.protein_g).toBe(99.1);
      expect(summary.remaining?.calories).toBe(1200);

      // Meals check:
      const breakfast = summary.meals.find((m) => m.meal === "breakfast");
      expect(breakfast?.protein_g).toBe(20.5);
    });

    it("should round aggregated macros to 1 decimal place", async () => {
      const userId = "user-1";
      const date = "2024-01-01";
      const logs = [
        {
          meal: "snack",
          calories: 100,
          protein_g: 1.11,
          fat_g: 1.11,
          carbs_g: 1.11,
        },
        {
          meal: "snack",
          calories: 100,
          protein_g: 2.22,
          fat_g: 2.22,
          carbs_g: 2.22,
        },
      ];

      vi.mocked(mockFoodRepository.getLogsByDate).mockResolvedValue(logs as any);
      vi.mocked(mockProfileRepository.getGoalByDate).mockResolvedValue(null);

      const summary = await summaryService.getDailySummary(userId, date);

      // 1.11 + 2.22 = 3.33 -> 3.3
      expect(summary.consumed.protein_g).toBe(3.3);
      expect(summary.meals.find((m) => m.meal === "snack")?.protein_g).toBe(3.3);
    });

    it("should handle goal exceeded (negative remaining macros)", async () => {
      const userId = "user-1";
      const date = "2024-01-01";
      const logs = [
        {
          meal: "dinner",
          calories: 2500,
          protein_g: 200,
          fat_g: 100,
          carbs_g: 300,
        },
      ];
      const goal = {
        daily_calories: 2000,
        protein_g: 150,
        fat_g: 70,
        carbs_g: 200,
      };

      vi.mocked(mockFoodRepository.getLogsByDate).mockResolvedValue(logs as any);
      vi.mocked(mockProfileRepository.getGoalByDate).mockResolvedValue(goal as any);

      const summary = await summaryService.getDailySummary(userId, date);

      expect(summary.remaining?.calories).toBe(-500);
      expect(summary.remaining?.protein_g).toBe(-50);
      expect(summary.remaining?.fat_g).toBe(-30);
      expect(summary.remaining?.carbs_g).toBe(-100);
    });

    it("should handle days with no logs and no goal", async () => {
      vi.mocked(mockFoodRepository.getLogsByDate).mockResolvedValue([]);
      vi.mocked(mockProfileRepository.getGoalByDate).mockResolvedValue(null);

      const summary = await summaryService.getDailySummary("user-1", "2024-01-01");

      expect(summary.consumed.calories).toBe(0);
      expect(summary.consumed.protein_g).toBe(0);
      expect(summary.goal).toBeNull();
      expect(summary.remaining).toBeNull();
      expect(summary.meals.every((m) => m.calories === 0)).toBe(true);
    });
  });

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
      expect(summary.days.every((d) => d.calories === 0)).toBe(true);
    });

    it("should handle month boundaries correctly", async () => {
      const userId = "user-1";
      const endDate = "2024-03-02"; // March 2nd
      // Expected range: Feb 25, 26, 27, 28, 29 (leap year), Mar 1, Mar 2

      const logs = [
        { date: "2024-02-28", calories: 1000, protein_g: 10, fat_g: 10, carbs_g: 10 },
        { date: "2024-02-29", calories: 1200, protein_g: 20, fat_g: 20, carbs_g: 20 },
        { date: "2024-03-01", calories: 1400, protein_g: 30, fat_g: 30, carbs_g: 30 },
      ];

      vi.mocked(mockFoodRepository.getLogsByDateRange).mockResolvedValue(logs as any);

      const summary = await summaryService.getWeeklySummary(userId, endDate);

      expect(summary.days).toHaveLength(7);
      expect(summary.days[0].date).toBe("2024-02-25");
      expect(summary.days[3].date).toBe("2024-02-28");
      expect(summary.days[4].date).toBe("2024-02-29");
      expect(summary.days[5].date).toBe("2024-03-01");
      expect(summary.days[6].date).toBe("2024-03-02");

      expect(summary.days[3].calories).toBe(1000);
      expect(summary.days[4].calories).toBe(1200);
      expect(summary.days[5].calories).toBe(1400);
    });

    it("should round weekly averages to 1 decimal place", async () => {
      const userId = "user-1";
      const endDate = "2024-01-07";
      const logs = [
        {
          date: "2024-01-01",
          calories: 100,
          protein_g: 1.11,
          fat_g: 1.11,
          carbs_g: 1.11,
        },
      ];

      vi.mocked(mockFoodRepository.getLogsByDateRange).mockResolvedValue(logs as any);

      const summary = await summaryService.getWeeklySummary(userId, endDate);

      // Average: 1.11 / 7 = 0.1585... -> 0.2
      expect(summary.average.protein_g).toBe(0.2);
    });
  });
});

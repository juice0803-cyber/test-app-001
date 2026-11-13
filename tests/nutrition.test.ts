import { describe, it, expect } from "vitest";
import { nutritionTargets, sumNutrition, completionAverage } from "@/lib/nutrition";
import { emptyProfile, profileSchema } from "@/lib/profile-schema";
const profile = { ...emptyProfile("測試"), age: 30, sex: "MALE" as const, heightCm: 175, startingWeightKg: 80, activity: "MODERATE" as const };
describe("可追溯的營養估算", () => {
  it("正確套用 Mifflin-St Jeor 與活動係數", () => {
    const result = nutritionTargets(profile);
    expect(result.bmr).toBe(1749);
    expect(result.tdee).toBe(2711);
    expect(result.protein).toBe(128);
  });
  it("使用女性公式的常數", () => expect(nutritionTargets({ ...profile, sex: "FEMALE" }).bmr).toBe(1583));
  it.each(["age", "heightCm", "startingWeightKg"] as const)("缺少 %s 不推測 BMR", key => {
    const result = nutritionTargets({ ...profile, [key]: null });
    expect(result.bmr).toBeNull(); expect(result.tdee).toBeNull(); expect(result.calories).toBeNull();
  });
  it("未提供性別時不猜測", () => expect(nutritionTargets({ ...profile, sex: "UNSPECIFIED" }).bmr).toBeNull());
  it("沒有個人資料時不產生示範目標", () => expect(nutritionTargets(null).calories).toBeNull());
  it.each(["PREGNANCY", "CLINICAL", "EATING_CONCERN"] as const)("特殊情況 %s 停用一般成人估算", riskContext => {
    const result = nutritionTargets({ ...profile, riskContext, calorieOverride: 1800 });
    expect(result.calories).toBeNull(); expect(result.bmr).toBeNull();
  });
  it("未成年人停用一般成人估算", () => expect(nutritionTargets({ ...profile, age: 16 }).calories).toBeNull());
  it("使用者目標優先", () => {
    const result = nutritionTargets({ ...profile, calorieOverride: 2200, proteinOverride: 150 });
    expect(result.calories).toBe(2200); expect(result.protein).toBe(150); expect(result.manual).toBe(true);
  });
  it("4/4/9 能量與目標一致，僅有四捨五入差異", () => {
    for (const goal of ["FAT_LOSS", "MUSCLE_GAIN", "MAINTAIN", "RECOMPOSITION"] as const) {
      const result = nutritionTargets({ ...profile, goal });
      expect(Math.abs(result.protein! * 4 + result.carbs! * 4 + result.fat! * 9 - result.calories!)).toBeLessThan(1);
    }
  });
  it("不顯示負碳水，提示目標衝突", () => {
    const result = nutritionTargets({ ...profile, calorieOverride: 1200, proteinOverride: 350 });
    expect(result.carbs).toBeNull(); expect(result.warning).toContain("超出");
  });
  it("缺漏紀錄與真實零攝取不同", () => {
    expect(sumNutrition([])).toBeNull();
    expect(sumNutrition([{ calories: 0, protein: 0, carbs: 0, fat: 0 }])?.calories).toBe(0);
  });
  it("驗收情境 A 的餐點可正確加總", () => expect(sumNutrition([{ calories: 650, protein: 42, carbs: 70, fat: 22 }])).toEqual({ calories: 650, protein: 42, carbs: 70, fat: 22 }));
  it("不把未完成日期納入平均", () => {
    expect(completionAverage([{ complete: true, calories: 1800, target: 2000 }, { complete: false, calories: 0, target: 2000 }])).toBe(.9);
    expect(completionAverage([{ complete: false, calories: 1000, target: 2000 }])).toBeNull();
  });
});
describe("輸入邊界", () => {
  it("拒絕未知 userId，避免跨使用者寫入", () => expect(profileSchema.safeParse({ ...profile, userId: "other-user" }).success).toBe(false));
  it.each([{ age: -1 }, { startingWeightKg: -5 }, { trainingDays: 8 }, { calorieOverride: 300 }, { proteinOverride: Infinity }, { heightCm: NaN }])("拒絕不合理值 %j", invalid => expect(profileSchema.safeParse({ ...profile, ...invalid }).success).toBe(false));
  it("支援只填暱稱與可留空欄位", () => expect(profileSchema.safeParse(emptyProfile("測試")).success).toBe(true));
});

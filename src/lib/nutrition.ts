import type { ProfileInput } from "./profile-schema";
const FACTORS = { SEDENTARY: 1.2, LIGHT: 1.375, MODERATE: 1.55, HIGH: 1.725, VERY_HIGH: 1.9 };
export function nutritionTargets(profile: ProfileInput | null) {
  const empty = { bmr: null, tdee: null, calories: null, protein: null, carbs: null, fat: null, factor: null, manual: false, warning: "請先完成個人資料，建立你的每日目標。" };
  if (!profile) return empty;
  if ((profile.age !== null && profile.age < 18) || profile.riskContext !== "GENERAL") {
    return { ...empty, warning: "目前情況不適用一般成人自動估算。請與醫師或營養師討論個人化目標。" };
  }
  const { age, sex, heightCm, startingWeightKg: weight } = profile;
  const complete = age !== null && sex !== "UNSPECIFIED" && heightCm !== null && weight !== null;
  const bmr = complete ? Math.round(10 * weight + 6.25 * heightCm - 5 * age + (sex === "MALE" ? 5 : -161)) : null;
  const factor = FACTORS[profile.activity];
  const tdee = bmr === null ? null : Math.round(bmr * factor);
  const adjustment = profile.goal === "FAT_LOSS" ? -250 : profile.goal === "MUSCLE_GAIN" ? 150 : 0;
  const calories = profile.calorieOverride ?? (tdee !== null && bmr !== null ? Math.max(1200, bmr, tdee + adjustment) : null);
  const protein = profile.proteinOverride ?? (weight !== null ? Math.round(weight * 1.6) : null);
  const fat = calories === null ? null : Math.round((calories * 0.3) / 9);
  const carbs = calories === null || protein === null || fat === null ? null : Math.round(((calories - protein * 4 - fat * 9) / 4) * 10) / 10;
  const impossible = carbs !== null && carbs < 0;
  const warning = impossible ? "蛋白質目標超出可用熱量，請重新調整目標。" : bmr !== null && calories !== null && calories < bmr ? "自訂熱量低於估算 BMR，建議先與營養師討論。" : !complete ? "必要資料尚未完整；BMR 與 TDEE 暫不估算。" : null;
  return { bmr, tdee, calories, protein, fat: impossible ? null : fat, carbs: impossible ? null : carbs, factor, manual: profile.calorieOverride !== null || profile.proteinOverride !== null, warning };
}
export function sumNutrition(entries: { calories: number; protein: number; carbs: number; fat: number }[]) {
  if (entries.length === 0) return null;
  return entries.reduce((sum, entry) => ({ calories: sum.calories + entry.calories, protein: sum.protein + entry.protein, carbs: sum.carbs + entry.carbs, fat: sum.fat + entry.fat }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
}
export function completionAverage(days: { complete: boolean; calories: number; target: number }[]) {
  const valid = days.filter(d => d.complete && d.target > 0);
  return valid.length ? valid.reduce((sum, day) => sum + day.calories / day.target, 0) / valid.length : null;
}

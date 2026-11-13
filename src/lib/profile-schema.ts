import { z } from "zod";
z.config(z.locales.zhTW());
const optionalNumber = (min: number, max: number, integer = false) => {
  let rule = z.number().finite().min(min, `不得小於 ${min}`).max(max, `不得大於 ${max}`);
  if (integer) rule = rule.int("請輸入整數");
  return rule.nullable();
};
export const profileSchema = z.strictObject({
  nickname: z.string().trim().min(1, "請輸入暱稱").max(40, "暱稱最多 40 字"),
  age: optionalNumber(13, 100, true),
  sex: z.enum(["MALE", "FEMALE", "UNSPECIFIED"]),
  heightCm: optionalNumber(100, 250),
  startingWeightKg: optionalNumber(25, 350),
  targetWeightKg: optionalNumber(25, 350),
  targetBodyFat: optionalNumber(3, 65),
  targetMuscleKg: optionalNumber(10, 100),
  goal: z.enum(["FAT_LOSS", "MUSCLE_GAIN", "MAINTAIN", "RECOMPOSITION"]),
  activity: z.enum(["SEDENTARY", "LIGHT", "MODERATE", "HIGH", "VERY_HIGH"]),
  trainingDays: z.number().int().min(0).max(7),
  trainingMinutes: z.number().int().min(10).max(180),
  experience: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  dietaryPreferences: z.string().trim().max(500),
  restrictions: z.string().trim().max(500),
  riskContext: z.enum(["GENERAL", "PREGNANCY", "CLINICAL", "EATING_CONCERN"]),
  calorieOverride: optionalNumber(1200, 6000, true),
  proteinOverride: optionalNumber(20, 350, true),
});
export type ProfileInput = z.infer<typeof profileSchema>;
export function emptyProfile(nickname = ""): ProfileInput {
  return { nickname, age: null, sex: "UNSPECIFIED", heightCm: null, startingWeightKg: null, targetWeightKg: null, targetBodyFat: null, targetMuscleKg: null, goal: "MAINTAIN", activity: "SEDENTARY", trainingDays: 3, trainingMinutes: 60, experience: "BEGINNER", dietaryPreferences: "", restrictions: "", riskContext: "GENERAL", calorieOverride: null, proteinOverride: null };
}

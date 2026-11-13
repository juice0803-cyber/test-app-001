import "server-only";
import { getDb } from "./db";
import { dayKey, dayStart, sevenDayTrend, shiftDay, weekStart } from "./dates";
import { nutritionTargets, sumNutrition } from "./nutrition";
import { profileSchema } from "./profile-schema";
export async function loadDashboard(userId: string, now = new Date()) {
  const db = getDb();
  const today = dayKey(now);
  const start = dayStart(today);
  const end = dayStart(shiftDay(today, 1));
  const monday = weekStart(today);
  const [rawProfile, food, weights, latestWeight, inbody, workouts, completedDays] = await Promise.all([
    db.userProfile.findUnique({ where: { userId } }),
    db.foodEntry.findMany({ where: { userId, eatenAt: { gte: start, lt: end } }, orderBy: { eatenAt: "asc" } }),
    db.bodyWeightRecord.findMany({ where: { userId, measuredAt: { gte: dayStart(shiftDay(today, -12)), lt: end } }, orderBy: { measuredAt: "asc" } }),
    db.bodyWeightRecord.findFirst({ where: { userId, measuredAt: { lt: end } }, orderBy: { measuredAt: "desc" } }),
    db.inbodyRecord.findFirst({ where: { userId, measuredAt: { lt: end } }, orderBy: { measuredAt: "desc" } }),
    db.workoutSession.findMany({ where: { userId, startedAt: { gte: dayStart(monday), lt: end }, completed: true }, select: { id: true, minutes: true } }),
    db.nutritionDay.count({ where: { userId, date: { gte: new Date(`${monday}T00:00:00Z`), lte: new Date(`${today}T00:00:00Z`) }, complete: true } }),
  ]);
  const profile = rawProfile ? profileSchema.parse(Object.fromEntries(Object.keys(profileSchema.shape).map(key => [key, rawProfile[key as keyof typeof rawProfile]]))) : null;
  const targets = nutritionTargets(profile);
  const intake = sumNutrition(food);
  return { today, profile, targets, intake, food, trend: sevenDayTrend(weights, today), latestWeight: latestWeight?.weightKg ?? null, inbody, completedDays, workouts: workouts.length, workoutMinutes: workouts.reduce((sum, w) => sum + w.minutes, 0) };
}
export type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;

export const TIME_ZONE = "Asia/Taipei";
export function dayKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
export function shiftDay(key: string, days: number): string {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export function dayStart(key: string): Date { return new Date(`${key}T00:00:00+08:00`); }
export function weekStart(key: string): string {
  const weekday = new Date(`${key}T12:00:00Z`).getUTCDay();
  return shiftDay(key, -(weekday === 0 ? 6 : weekday - 1));
}
export function sevenDayTrend(records: { measuredAt: Date; weightKg: number }[], endKey: string) {
  const buckets = new Map<string, number[]>();
  for (const item of records) {
    const key = dayKey(item.measuredAt);
    buckets.set(key, [...(buckets.get(key) ?? []), item.weightKg]);
  }
  const average = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
  const daily = new Map([...buckets].map(([key, values]) => [key, average(values)]));
  return Array.from({ length: 7 }, (_, index) => {
    const key = shiftDay(endKey, index - 6);
    const window = Array.from({ length: 7 }, (_, offset) => daily.get(shiftDay(key, -offset))).filter((v): v is number => v !== undefined);
    return { date: key, label: key.slice(5).replace("-", "/"), weight: daily.get(key) ?? null, average: window.length ? Math.round(average(window) * 100) / 100 : null, samples: window.length };
  });
}

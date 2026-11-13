import { describe, it, expect } from "vitest";
import { dayKey, dayStart, shiftDay, weekStart, sevenDayTrend } from "@/lib/dates";
describe("台北時間與趨勢", () => {
  it("UTC 跨日正確轉成台北日期", () => expect(dayKey(new Date("2026-11-12T16:10:00Z"))).toBe("2026-11-13"));
  it("台北午夜落在前一個 UTC 日期", () => expect(dayStart("2026-11-13").toISOString()).toBe("2026-11-12T16:00:00.000Z"));
  it("跨月與跨年位移", () => { expect(shiftDay("2026-12-31", 1)).toBe("2027-01-01"); expect(shiftDay("2026-03-01", -1)).toBe("2026-02-28"); });
  it("一週以週一為起點", () => { expect(weekStart("2026-11-15")).toBe("2026-11-09"); expect(weekStart("2026-11-09")).toBe("2026-11-09"); });
  it("同日多次量測先取日平均，缺漏日不當零", () => {
    const points = sevenDayTrend([{ measuredAt: new Date("2026-11-12T08:00:00+08:00"), weightKg: 80 }, { measuredAt: new Date("2026-11-12T20:00:00+08:00"), weightKg: 82 }, { measuredAt: new Date("2026-11-13T08:00:00+08:00"), weightKg: 79 }], "2026-11-13");
    expect(points.at(-1)?.average).toBe(80); expect(points.at(-1)?.samples).toBe(2); expect(points.at(-2)?.weight).toBe(81); expect(points[0].weight).toBeNull();
  });
  it("無量測時回傳空值", () => { const points = sevenDayTrend([], "2026-11-13"); expect(points).toHaveLength(7); expect(points.every(p => p.weight === null && p.average === null)).toBe(true); });
});

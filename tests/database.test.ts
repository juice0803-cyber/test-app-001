import { beforeAll, afterAll, it, expect, describe } from "vitest";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
let database: PGlite;
let server: PGLiteSocketServer;
let db: PrismaClient;
beforeAll(async () => {
  database = await PGlite.create();
  await database.exec(await readFile("prisma/migrations/202611130001_phase1/migration.sql", "utf8"));
  server = new PGLiteSocketServer({ db: database, port: 5544, host: "127.0.0.1" });
  await server.start();
  db = new PrismaClient({ adapter: new PrismaPg({ connectionString: "postgresql://postgres:postgres@127.0.0.1:5544/fitness", max: 1 }) });
});
afterAll(async () => { await db?.$disconnect(); await server?.stop(); await database?.close(); });
describe("PostgreSQL Migration 與實際關聯", () => {
  it("儲存個人檔案後可查回，且帳號相互獨立", async () => {
    await db.user.create({ data: { id: "user-a", email: "a@example.test", name: "甲" } });
    await db.user.create({ data: { id: "user-b", email: "b@example.test", name: "乙" } });
    await db.userProfile.create({ data: { userId: "user-a", nickname: "測試甲", startingWeightKg: 78.5 } });
    expect((await db.userProfile.findUnique({ where: { userId: "user-a" } }))?.startingWeightKg).toBe(78.5);
    expect(await db.userProfile.findUnique({ where: { userId: "user-b" } })).toBeNull();
  });
  it("外鍵阻擋孤立健康紀錄", async () => {
    await expect(db.bodyWeightRecord.create({ data: { userId: "missing", measuredAt: new Date(), weightKg: 78.5 } })).rejects.toThrow();
  });
  it("一位使用者只能有一份個人檔案", async () => {
    await expect(db.userProfile.create({ data: { userId: "user-a", nickname: "重複" } })).rejects.toThrow();
  });
  it("刪除帳號連帶刪除健康數據及登入工作階段", async () => {
    await db.bodyWeightRecord.create({ data: { userId: "user-a", measuredAt: new Date(), weightKg: 78.5 } });
    await db.session.create({ data: { id: "session-a", userId: "user-a", token: "test-only-session", expiresAt: new Date(Date.now() + 60000) } });
    await db.workoutSession.create({ data: { userId: "user-a", name: "測試訓練", startedAt: new Date(), minutes: 30, exercises: { create: { name: "深蹲", muscle: "腿", equipment: "槓鈴", position: 1, sets: { create: { position: 1, weightKg: 60, reps: 10 } } } } } });
    await db.user.delete({ where: { id: "user-a" } });
    expect(await db.userProfile.count({ where: { userId: "user-a" } })).toBe(0);
    expect(await db.bodyWeightRecord.count({ where: { userId: "user-a" } })).toBe(0);
    expect(await db.session.count({ where: { userId: "user-a" } })).toBe(0);
    expect(await db.workoutSet.count()).toBe(0);
    expect(await db.user.count({ where: { id: "user-b" } })).toBe(1);
  });
});

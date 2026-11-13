import "server-only";
export function isConfigured() {
  return Boolean(process.env.DATABASE_URL && process.env.BETTER_AUTH_URL && process.env.BETTER_AUTH_SECRET && process.env.BETTER_AUTH_SECRET.length >= 32);
}
export function runtimeConfig() {
  if (!isConfigured()) throw new Error("系統尚未完成環境設定，請參考 README。");
  return { databaseUrl: process.env.DATABASE_URL!, authUrl: process.env.BETTER_AUTH_URL!, secret: process.env.BETTER_AUTH_SECRET! };
}

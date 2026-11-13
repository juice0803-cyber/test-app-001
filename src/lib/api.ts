import "server-only";
import { getAuth } from "./auth";
import { runtimeConfig } from "./env";
import { ZodError } from "zod";
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function apiSession(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) throw new ApiError(401, "請先登入。");
  return session;
}
export function assertOrigin(request: Request) {
  if (request.headers.get("origin") !== new URL(runtimeConfig().authUrl).origin) throw new ApiError(403, "請由本應用程式提交資料。");
}
export async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new ApiError(415, "請使用 JSON 格式。");
  // 限制實際串流大小，不依賴可偽造的 Content-Length。
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "請提供資料。");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.length;
    if (bytes > 32768) { await reader.cancel(); throw new ApiError(413, "資料過大。"); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new ApiError(400, "資料格式不正確。"); }
}
export function apiError(error: unknown) {
  if (error instanceof ApiError) return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError) return Response.json({ error: "請檢查輸入欄位。", fields: error.flatten().fieldErrors }, { status: 400 });
  // 不將例外或健康資料寫入日誌，也不回傳連線資訊。
  return Response.json({ error: "服務暫時無法使用，請稍後重試或確認資料庫設定。" }, { status: 503 });
}

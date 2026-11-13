import { getDb } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await getDb().$queryRaw`SELECT 1`;
    return Response.json({ service: "ai-fitness-coach", status: "ready" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ service: "ai-fitness-coach", status: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

import { apiSession, apiError } from "@/lib/api";
import { loadDashboard } from "@/lib/dashboard";
export async function GET(request: Request) {
  try {
    const { user } = await apiSession(request);
    return Response.json(await loadDashboard(user.id), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}

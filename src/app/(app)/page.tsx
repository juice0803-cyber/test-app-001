import { requireSession } from "@/lib/session";
import { loadDashboard } from "@/lib/dashboard";
import { isConfigured } from "@/lib/env";
import { DashboardView } from "@/components/dashboard-view";
export default async function DashboardPage() {
  if (!isConfigured()) return null;
  const { user } = await requireSession();
  const data = await loadDashboard(user.id);
  return <DashboardView data={data} name={data.profile?.nickname ?? user.name} />;
}

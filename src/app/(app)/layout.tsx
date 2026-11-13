import { AppShell } from "@/components/app-shell";
import { SetupNotice } from "@/components/setup-notice";
import { isConfigured } from "@/lib/env";
import { requireSession } from "@/lib/session";
export const dynamic = "force-dynamic";
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  if (!isConfigured()) return <SetupNotice />;
  const { user } = await requireSession();
  return <AppShell name={user.name} email={user.email}>{children}</AppShell>;
}

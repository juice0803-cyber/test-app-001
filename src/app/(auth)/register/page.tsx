import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AuthForm } from "@/components/auth-form";
import { AuthLayout } from "@/components/auth-layout";
import { SetupNotice } from "@/components/setup-notice";
import { isConfigured } from "@/lib/env";
import { getAuth } from "@/lib/auth";
export const metadata: Metadata = { title: "建立帳號" };
export const dynamic = "force-dynamic";
export default async function RegisterPage() {
  if (!isConfigured()) return <SetupNotice />;
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (session) redirect("/");
  return <AuthLayout register><AuthForm register /></AuthLayout>;
}

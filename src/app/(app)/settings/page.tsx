import type { Metadata } from "next";
import { requireSession } from "@/lib/session";
import { getDb } from "@/lib/db";
import { isConfigured } from "@/lib/env";
import { emptyProfile, profileSchema } from "@/lib/profile-schema";
import { ProfileForm } from "@/components/profile-form";
export const metadata: Metadata = { title: "個人設定" };
export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  if (!isConfigured()) return null;
  const { user } = await requireSession();
  const raw = await getDb().userProfile.findUnique({ where: { userId: user.id } });
  const initial = raw ? profileSchema.parse(Object.fromEntries(Object.keys(profileSchema.shape).map(key => [key, raw[key as keyof typeof raw]]))) : emptyProfile(user.name);
  const params = await searchParams;
  return <><section className="page-heading"><div><div className="eyebrow text-green">為你的生活而設定</div><h1>每個目標，都從了解自己開始。</h1><p>設定你的基本資料，找到適合自己的健康節奏。</p></div></section><ProfileForm initial={initial} email={user.email} welcome={params.welcome === "1"} /></>;
}

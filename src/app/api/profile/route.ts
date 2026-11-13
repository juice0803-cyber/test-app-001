import { apiSession, assertOrigin, readJson, apiError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { profileSchema } from "@/lib/profile-schema";
export async function GET(request: Request) {
  try {
    const { user } = await apiSession(request);
    const profile = await getDb().userProfile.findUnique({ where: { userId: user.id } });
    return Response.json({ profile }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
export async function PUT(request: Request) {
  try {
    assertOrigin(request);
    const { user } = await apiSession(request);
    const data = profileSchema.parse(await readJson(request));
    const profile = await getDb().$transaction(async tx => {
      const saved = await tx.userProfile.upsert({ where: { userId: user.id }, create: { ...data, userId: user.id }, update: data });
      await tx.user.update({ where: { id: user.id }, data: { name: data.nickname } });
      return saved;
    });
    return Response.json({ profile }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}

import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";
import { apiError } from "@/lib/api";
export async function GET(request: Request) {
  try { return await toNextJsHandler(getAuth()).GET(request); } catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try { return await toNextJsHandler(getAuth()).POST(request); } catch (error) { return apiError(error); }
}

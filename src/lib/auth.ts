import "server-only";
import { betterAuth } from "better-auth/minimal";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { getDb } from "./db";
import { runtimeConfig } from "./env";
function createAuth() {
  const { authUrl, secret } = runtimeConfig();
  return betterAuth({
    appName: "AI Fitness Coach",
    baseURL: authUrl,
    secret,
    database: prismaAdapter(getDb(), { provider: "postgresql" }),
    trustedOrigins: [new URL(authUrl).origin],
    emailAndPassword: { enabled: true, minPasswordLength: 12, maxPasswordLength: 128, autoSignIn: true },
    user: { deleteUser: { enabled: true } },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24, cookieCache: { enabled: false } },
    rateLimit: { enabled: true, storage: "database", window: 60, max: 60, customRules: { "/sign-in/email": { window: 60, max: 8 }, "/sign-up/email": { window: 60, max: 5 } } },
    advanced: { useSecureCookies: new URL(authUrl).protocol === "https:" },
    logger: { disabled: true },
  });
}
let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth() { return instance ??= createAuth(); }

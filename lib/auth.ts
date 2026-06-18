import { createNeonAuth } from "@neondatabase/auth/next/server";

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
});

type AuthResult = Awaited<ReturnType<typeof auth.getSession>>;
export type Session = AuthResult extends { data: infer D } ? D : null;
export type User = NonNullable<Session> extends { user: infer U } ? U : never;



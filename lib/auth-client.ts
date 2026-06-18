import { createAuthClient } from "@neondatabase/auth/next";

export const authClient = createAuthClient();

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
} = authClient;


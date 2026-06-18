import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const PROTECTED_ADMIN_ROUTES = ["/admin"];
const PROTECTED_MEMBER_ROUTES = ["/dashboard"];
const AUTH_ROUTES = ["/auth/login", "/auth/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get session from Neon Auth
  const { data: session } = await auth.getSession({
    fetchOptions: { headers: request.headers },
  });

  const isAuthenticated = !!session;

  // Redirect logged-in users away from auth pages
  if (isAuthenticated && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Protect member routes
  if (PROTECTED_MEMBER_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect admin routes (permission check is done at the page/API level)
  if (PROTECTED_ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/auth/:path*",
  ],
};

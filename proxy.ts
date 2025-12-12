import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

// Routes that require authentication
const protectedRoutes = ["/dashboard"];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ["/auth/login", "/auth/register"];

// Create the i18n middleware
const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Only perform redirects on GET/HEAD requests
  // POST/PUT/DELETE/PATCH requests should pass through
  const shouldCheckRedirects = method === "GET" || method === "HEAD";

  if (shouldCheckRedirects) {
    // Get access token from cookies
    const accessToken = request.cookies.get("accessToken")?.value;
    const isAuthenticated = !!accessToken;

    // Check if the current path (without locale) is protected
    const isProtectedRoute = protectedRoutes.some((route) =>
      pathname.includes(route)
    );

    // Check if the current path (without locale) is an auth route
    const isAuthRoute = authRoutes.some((route) => pathname.includes(route));

    // Redirect to login if accessing protected route without authentication
    if (isProtectedRoute && !isAuthenticated) {
      const locale = pathname.split("/")[1] || routing.defaultLocale;
      const loginUrl = new URL(`/${locale}/auth/login`, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Redirect to dashboard if accessing auth routes while authenticated
    if (isAuthRoute && isAuthenticated) {
      const locale = pathname.split("/")[1] || routing.defaultLocale;
      const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Continue with i18n middleware
  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};

import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { defaultLocale, locales, routing } from "@/i18n/routing";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

const intlMiddleware = createMiddleware(routing);
const protectedWorkspaceSegments = new Set([
  "agents",
  "applications",
  "commissions",
  "crm",
  "dashboard",
  "documents",
  "finance",
  "hr",
  "profile",
  "support",
  "students",
  "updates",
  "universities",
]);

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/login") {
    return NextResponse.next();
  }

  const protectedRoute = getProtectedRoute(request.nextUrl.pathname);

  if (protectedRoute && !request.cookies.has(SESSION_COOKIE_NAME)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname =
      protectedRoute.locale === defaultLocale
        ? "/login"
        : `/${protectedRoute.locale}/login`;
    loginUrl.search = "";
    loginUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );

    return NextResponse.redirect(loginUrl);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|login|.*\\..*).*)"],
};

function getProtectedRoute(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const first = parts[0];

  if (locales.includes(first as (typeof locales)[number])) {
    return protectedWorkspaceSegments.has(parts[1]) ? { locale: first } : null;
  }

  return protectedWorkspaceSegments.has(first)
    ? { locale: defaultLocale }
    : null;
}

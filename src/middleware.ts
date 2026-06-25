import { NextRequest, NextResponse } from "next/server";

const TOKEN_KEY = "access_token";

const managementRoutes = [
  "/management/dashboard",
  "/management/users",
  "/management/roles",
  "/management/permissions",
  "/management/jobs",
  "/management/profile",
  "/management/uploads",
];

const userRoutes = ["/profile", "/uploads"];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get(TOKEN_KEY)?.value;

  const isManagementProtected = managementRoutes.some((route) => pathname.startsWith(route));
  const isUserProtected = userRoutes.some((route) => pathname.startsWith(route));

  if (isManagementProtected && !token) {
    const loginUrl = new URL("/management/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isUserProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/management/login" && token) {
    return NextResponse.redirect(new URL("/management/dashboard", request.url));
  }

  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/schedule", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/management/:path*", "/profile/:path*", "/uploads/:path*", "/login"],
};

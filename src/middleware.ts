import { NextRequest, NextResponse } from "next/server";

const USER_TOKEN_KEY = "access_token";
const MANAGEMENT_TOKEN_KEY = "management_access_token";

const managementRoutes = [
  "/management/dashboard",
  "/management/users",
  "/management/staffs",
  "/management/roles",
  "/management/permissions",
  "/management/jobs",
  "/management/profile",
  "/management/uploads",
];

const userRoutes = ["/profile", "/uploads"];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const userToken = request.cookies.get(USER_TOKEN_KEY)?.value;
  const managementToken = request.cookies.get(MANAGEMENT_TOKEN_KEY)?.value;

  const isManagementProtected = managementRoutes.some((route) => pathname.startsWith(route));
  const isUserProtected = userRoutes.some((route) => pathname.startsWith(route));

  if (isManagementProtected && !managementToken) {
    const loginUrl = new URL("/management/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isUserProtected && !userToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/management/login" && managementToken) {
    return NextResponse.redirect(new URL("/management/dashboard", request.url));
  }

  if (pathname === "/login" && userToken) {
    return NextResponse.redirect(new URL("/schedule", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/management/:path*", "/profile/:path*", "/uploads/:path*", "/login"],
};

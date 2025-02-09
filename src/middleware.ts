import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("[InfinityChat]:token")?.value;

  const protectedRoutes = ["/", "/room/:id"];
  const publicRoutes = ["/login", "/signup"];

  const path = request.nextUrl.pathname;

  if (token && publicRoutes.includes(path)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!token && protectedRoutes.includes(path)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

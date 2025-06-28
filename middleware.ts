// middleware.ts
import { NextResponse, NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const userType = request.cookies.get("user-type")?.value;
  const pathname = request.nextUrl.pathname;
  // Only allow users to access their own pages
  if (pathname.startsWith("/hrd") && userType !== "hrd") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname.startsWith("/halaman-driver") && userType !== "driver") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname.startsWith("/atur-pengantaran") && userType !== "gudang") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname.startsWith("/sales") && userType !== "sales") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  // Default allow
  return NextResponse.next();
}

export const config = {
  matcher: ["/atur-pengantaran", "/halaman-driver", "/hrd", "/sales"],
};

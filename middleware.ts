// middleware.ts
import { NextResponse, NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Ambil cookie yang dibutuhkan
  const accessToken = request.cookies.get("sb-access-token")?.value;
  const refreshToken = request.cookies.get("sb-refresh-token")?.value;
  const userType = request.cookies.get("user-type")?.value;

  console.log(accessToken, refreshToken, userType, "inimi");
  // Jika token tidak ada, redirect ke halaman utama
  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Batasi akses berdasarkan user-type
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

// Konfigurasi route yang dilindungi middleware
export const config = {
  matcher: ["/atur-pengantaran", "/halaman-driver", "/hrd", "/sales"],
};

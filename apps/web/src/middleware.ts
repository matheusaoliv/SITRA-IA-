import { NextRequest, NextResponse } from 'next/server';
export function middleware(request: NextRequest) {
  const hasSessionCookie = request.cookies.has('sitra_session');
  const isSignIn = request.nextUrl.pathname.startsWith('/sign-in');
  if (!hasSessionCookie && !isSignIn) {
    const destination = new URL('/sign-in', request.url);
    destination.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(destination);
  }
  return NextResponse.next();
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'] };

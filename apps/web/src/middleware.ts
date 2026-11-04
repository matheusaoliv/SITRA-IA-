import { NextRequest, NextResponse } from 'next/server';
// A API valida a sessão e pode estar em outro host. A presença do cookie no frontend
// não é critério confiável para autorizar ou bloquear a navegação.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'] };

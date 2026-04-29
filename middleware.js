import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/shop', '/presentation', '/zendesk', '/stripe', '/contact'];
const API_PREFIX = '/api';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith(API_PREFIX) || PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get('demo_user');
  if (!cookie?.value) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|screencaptures|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)).*)'],
};

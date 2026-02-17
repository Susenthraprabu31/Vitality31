import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { authConfig, isProtectedPage, isPublicPage, isLoginPage } from './lib/auth-config';

function hasAuthCookies(request: NextRequest): boolean {
  const authToken = request.cookies.get('auth_token')?.value || request.cookies.get('authToken')?.value;
  const userId = request.cookies.get('user_id')?.value || request.cookies.get('userId')?.value;
  return Boolean(authToken && userId);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next.js internals and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  if (isPublicPage(pathname) || isLoginPage(pathname)) {
    return NextResponse.next();
  }

  // Only guard explicitly protected pages - do not guard unknown routes
  const shouldGuard = isProtectedPage(pathname);
  if (shouldGuard && !hasAuthCookies(request)) {
    // Only redirect to login if loginPage is explicitly defined
    if (authConfig.loginPage) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = authConfig.loginPage;
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // If no login page is defined, return 403 Forbidden
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

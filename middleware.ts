import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose/jwt/verify';

const COOKIE_NAME = 'admin_session_tupalabra';
const SECRET_STRING = process.env.JWT_SECRET || 'clave-secreta-super-segura-iglesia-tu-palabra-2026-min-32-caracteres';
const SECRET = new TextEncoder().encode(SECRET_STRING);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Solo aplicar a rutas dentro de /admin
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    let autenticado = false;

    if (token) {
      try {
        await jwtVerify(token, SECRET);
        autenticado = true;
      } catch {
        autenticado = false;
      }
    }

    // Si intenta acceder al login estando ya autenticado, redirigir al panel
    if (pathname === '/admin/login') {
      if (autenticado) {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      return NextResponse.next();
    }

    // Para cualquier otra subruta de /admin, requerir autenticación
    if (!autenticado) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

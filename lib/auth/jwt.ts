import { SignJWT } from 'jose/jwt/sign';
import { jwtVerify } from 'jose/jwt/verify';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'admin_session_tupalabra';
const SECRET_STRING = process.env.JWT_SECRET || 'clave-secreta-super-segura-iglesia-tu-palabra-2026-min-32-caracteres';
const SECRET = new TextEncoder().encode(SECRET_STRING);

export interface AdminJWTPayload {
  adminId: string;
  usuario: string;
  correo: string;
}

export async function firmarTokenAdmin(payload: AdminJWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h') // 8 horas de duración
    .sign(SECRET);
}

export async function verificarTokenAdmin(token: string): Promise<AdminJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      adminId: payload.adminId as string,
      usuario: payload.usuario as string,
      correo: payload.correo as string,
    };
  } catch {
    return null;
  }
}

export async function establecerCookieSesion(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 8 * 60 * 60, // 8 horas en segundos
    path: '/',
  });
}

export async function eliminarCookieSesion() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function obtenerSesionAdmin(): Promise<AdminJWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verificarTokenAdmin(token);
  } catch {
    return null;
  }
}

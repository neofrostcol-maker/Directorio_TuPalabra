import { NextResponse } from 'next/server';
import { eliminarCookieSesion, obtenerSesionAdmin } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { auditoria } from '@/lib/db/schema';
import crypto from 'node:crypto';

export async function POST() {
  const sesion = await obtenerSesionAdmin();
  if (sesion) {
    try {
      await db.insert(auditoria).values({
        id: crypto.randomUUID(),
        adminId: sesion.adminId,
        accion: 'logout',
        entidad: 'admin',
        entidadId: sesion.adminId,
        detalle: 'Cierre de sesión',
        fecha: new Date().toISOString(),
      });
    } catch {}
  }
  await eliminarCookieSesion();
  return NextResponse.json({ success: true });
}

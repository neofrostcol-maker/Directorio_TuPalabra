import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { db } from '@/lib/db';
import { ensureDatabaseReady } from '@/lib/db/bootstrap';
import { admins, auditoria } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { obtenerSesionAdmin } from '@/lib/auth/jwt';
import { cambioPasswordSchema } from '@/lib/validations/admin';

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseReady();
    const sesion = await obtenerSesionAdmin();
    if (!sesion) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const body = await req.json();
    const validacion = cambioPasswordSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json(
        { error: validacion.error.issues[0]?.message || 'Datos de contraseña inválidos.' },
        { status: 400 }
      );
    }

    const { passwordActual, nuevoPassword } = validacion.data;

    const admin = await db
      .select()
      .from(admins)
      .where(eq(admins.id, sesion.adminId))
      .get();

    if (!admin) {
      return NextResponse.json({ error: 'Administrador no encontrado.' }, { status: 404 });
    }

    const coincide = await bcrypt.compare(passwordActual, admin.passwordHash);
    if (!coincide) {
      return NextResponse.json(
        { error: 'La contraseña actual no es correcta.' },
        { status: 400 }
      );
    }

    // Hashear con costo 12 (requerimiento explícito)
    const nuevoHash = await bcrypt.hash(nuevoPassword, 12);
    const ahoraIso = new Date().toISOString();

    await db
      .update(admins)
      .set({ passwordHash: nuevoHash })
      .where(eq(admins.id, admin.id));

    await db.insert(auditoria).values({
      id: crypto.randomUUID(),
      adminId: admin.id,
      accion: 'cambio_password',
      entidad: 'admin',
      entidadId: admin.id,
      detalle: 'Cambio de contraseña de administrador exitoso',
      fecha: ahoraIso,
    });

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada correctamente.',
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    return NextResponse.json({ error: 'Error al cambiar la contraseña.' }, { status: 500 });
  }
}

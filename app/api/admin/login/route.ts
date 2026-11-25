import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { db } from '@/lib/db';
import { admins, auditoria } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { loginSchema } from '@/lib/validations/admin';
import {
  verificarBloqueoLogin,
  registrarIntentoLoginFallido,
  resetearIntentosLogin,
} from '@/lib/rate-limit';
import { firmarTokenAdmin, establecerCookieSesion } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const body = await req.json();
    const validacion = loginSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json({ error: 'Credenciales inválidas.' }, { status: 400 });
    }

    const { usuario, password } = validacion.data;
    const lockKey = `${ip}_${usuario.toLowerCase()}`;

    // 1. Verificar si está bloqueado temporalmente por intentos fallidos
    const bloqueo = verificarBloqueoLogin(lockKey);
    if (bloqueo.bloqueado) {
      return NextResponse.json(
        {
          error: `Acceso temporalmente bloqueado debido a múltiples intentos fallidos. Intenta de nuevo en ${bloqueo.minutosRestantes} minutos.`,
        },
        { status: 429 }
      );
    }

    // 2. Buscar admin en base de datos
    const admin = await db
      .select()
      .from(admins)
      .where(eq(admins.usuario, usuario))
      .get();

    if (!admin) {
      const intento = registrarIntentoLoginFallido(lockKey);
      if (intento.bloqueadoAhora) {
        return NextResponse.json(
          {
            error: 'Demasiados intentos fallidos. Tu acceso ha sido bloqueado por 15 minutos.',
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos.' },
        { status: 401 }
      );
    }

    // 3. Comparar contraseña con bcrypt
    const match = await bcrypt.compare(password, admin.passwordHash);
    if (!match) {
      const intento = registrarIntentoLoginFallido(lockKey);
      if (intento.bloqueadoAhora) {
        return NextResponse.json(
          {
            error: 'Demasiados intentos fallidos. Tu acceso ha sido bloqueado por 15 minutos.',
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos.' },
        { status: 401 }
      );
    }

    // 4. Éxito: resetear intentos fallidos
    resetearIntentosLogin(lockKey);

    const ahoraIso = new Date().toISOString();
    await db
      .update(admins)
      .set({ ultimoLogin: ahoraIso })
      .where(eq(admins.id, admin.id));

    // Registrar en auditoría
    await db.insert(auditoria).values({
      id: crypto.randomUUID(),
      adminId: admin.id,
      accion: 'login',
      entidad: 'admin',
      entidadId: admin.id,
      detalle: `Inicio de sesión exitoso desde IP ${ip.substring(0, 15)}`,
      fecha: ahoraIso,
    });

    // 5. Crear token JWT y establecer cookie
    const token = await firmarTokenAdmin({
      adminId: admin.id,
      usuario: admin.usuario,
      correo: admin.correo,
    });

    await establecerCookieSesion(token);

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        usuario: admin.usuario,
        correo: admin.correo,
      },
    });
  } catch (error) {
    console.error('Error en login admin:', error);
    return NextResponse.json({ error: 'Error procesando la solicitud de acceso.' }, { status: 500 });
  }
}

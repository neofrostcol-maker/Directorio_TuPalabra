import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auditoria } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { obtenerSesionAdmin } from '@/lib/auth/jwt';

export async function GET() {
  try {
    const sesion = await obtenerSesionAdmin();
    if (!sesion) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const registros = await db
      .select()
      .from(auditoria)
      .orderBy(desc(auditoria.fecha))
      .limit(100)
      .all();

    return NextResponse.json(registros);
  } catch (error) {
    console.error('Error al obtener registros de auditoría:', error);
    return NextResponse.json({ error: 'Error al consultar auditoría.' }, { status: 500 });
  }
}

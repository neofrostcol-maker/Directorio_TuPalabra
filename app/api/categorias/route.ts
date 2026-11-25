import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDatabaseReady } from '@/lib/db/bootstrap';
import { categorias } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';
import { CATEGORIAS_OFICIALES } from '@/lib/constants/categorias';

export async function GET() {
  try {
    await ensureDatabaseReady();
    const lista = await db.select().from(categorias).orderBy(asc(categorias.nombre)).all();
    if (lista && lista.length > 0) {
      return NextResponse.json(lista);
    }
  } catch (error) {
    console.warn('Advertencia obteniendo categorías de BD, usando lista oficial base:', error);
  }

  // Fallback garantizado ordenado por nombre
  const fallback = [...CATEGORIAS_OFICIALES].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, 'es')
  );

  return NextResponse.json(fallback);
}

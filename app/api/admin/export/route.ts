import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { negocios, negocioCategorias, categorias } from '@/lib/db/schema';
import { eq, desc, inArray, and, sql } from 'drizzle-orm';
import { obtenerSesionAdmin } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  try {
    const admin = await obtenerSesionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const tipo = searchParams.get('tipo');
    const categoriaId = searchParams.get('categoriaId') ? parseInt(searchParams.get('categoriaId')!, 10) : null;
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');

    const condiciones = [];
    if (estado && ['pendiente', 'aprobado', 'rechazado'].includes(estado)) {
      condiciones.push(eq(negocios.estado, estado as any));
    }
    if (tipo && ['empresa', 'persona_natural'].includes(tipo)) {
      condiciones.push(eq(negocios.tipo, tipo as any));
    }
    if (fechaDesde) {
      condiciones.push(sql`${negocios.creadoEn} >= ${fechaDesde}`);
    }
    if (fechaHasta) {
      condiciones.push(sql`${negocios.creadoEn} <= ${fechaHasta + 'T23:59:59Z'}`);
    }
    if (categoriaId) {
      const rels = await db
        .select({ negocioId: negocioCategorias.negocioId })
        .from(negocioCategorias)
        .where(eq(negocioCategorias.categoriaId, categoriaId))
        .all();
      const idsDeCat = rels.map((r) => r.negocioId);
      if (idsDeCat.length === 0) {
        condiciones.push(sql`1 = 0`);
      } else {
        condiciones.push(inArray(negocios.id, idsDeCat));
      }
    }

    const whereClause = condiciones.length > 0 ? and(...condiciones) : undefined;
    const lista = await db.select().from(negocios).where(whereClause).orderBy(desc(negocios.creadoEn)).all();

    const ids = lista.map((n) => n.id);
    let relCats: Array<{ negocioId: string; nombre: string }> = [];

    if (ids.length > 0) {
      relCats = await db
        .select({
          negocioId: negocioCategorias.negocioId,
          nombre: categorias.nombre,
        })
        .from(negocioCategorias)
        .innerJoin(categorias, eq(negocioCategorias.categoriaId, categorias.id))
        .where(inArray(negocioCategorias.negocioId, ids))
        .all();
    }

    // Cabecera CSV
    const encabezados = [
      'ID',
      'Estado',
      'Tipo',
      'Nombre del Negocio',
      'Categorías',
      'Responsable',
      'Teléfono/WhatsApp',
      'Correo Electrónico',
      'Dirección',
      'Ciudad',
      'Barrio',
      'Miembro Tu Palabra',
      'Documento/NIT (Privado)',
      'Sitio Web',
      'Instagram',
      'Horario',
      'Promoción Miembros',
      'Fecha Registro',
      'Fecha Aprobación',
    ];

    const escapeCsv = (val: string | null | undefined | boolean | number) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const filas = lista.map((n) => {
      const cats = relCats.filter((c) => c.negocioId === n.id).map((c) => c.nombre).join(', ');
      return [
        escapeCsv(n.id),
        escapeCsv(n.estado),
        escapeCsv(n.tipo === 'empresa' ? 'Empresa' : 'Persona Natural'),
        escapeCsv(n.nombreNegocio),
        escapeCsv(cats),
        escapeCsv(n.responsable),
        escapeCsv(n.telefono),
        escapeCsv(n.correo),
        escapeCsv(n.direccion),
        escapeCsv(n.ciudad),
        escapeCsv(n.barrio),
        escapeCsv(n.esMiembroIglesia ? 'Sí' : 'No'),
        escapeCsv(n.documento),
        escapeCsv(n.sitioWeb),
        escapeCsv(n.instagram),
        escapeCsv(n.horario),
        escapeCsv(n.promocionMiembros),
        escapeCsv(n.creadoEn),
        escapeCsv(n.aprobadoEn),
      ].join(';'); // Usamos punto y coma para compatibilidad directa con Excel en español
    });

    // UTF-8 BOM (\uFEFF) para forzar detección correcta de tildes y caracteres en Excel
    const csvContent = '\uFEFF' + [encabezados.join(';'), ...filas].join('\r\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="directorio_tu_palabra_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exportando CSV:', error);
    return NextResponse.json({ error: 'Error al exportar datos.' }, { status: 500 });
  }
}

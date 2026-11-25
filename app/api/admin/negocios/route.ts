import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { db } from '@/lib/db';
import { ensureDatabaseReady } from '@/lib/db/bootstrap';
import {
  negocios,
  negocioImagenes,
  negocioCategorias,
  categorias,
  auditoria,
} from '@/lib/db/schema';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import { obtenerSesionAdmin } from '@/lib/auth/jwt';
import { accionMasivaSchema } from '@/lib/validations/admin';
import { notificarAprobacionNegocio, notificarRechazoNegocio } from '@/lib/email';
import { eliminarImagenBlob } from '@/lib/storage/blob';

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseReady();
    const admin = await obtenerSesionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado') || ''; // 'pendiente' | 'aprobado' | 'rechazado' | ''
    const tipo = searchParams.get('tipo') || '';
    const categoriaId = searchParams.get('categoriaId') ? parseInt(searchParams.get('categoriaId')!, 10) : null;
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const pagina = Math.max(1, parseInt(searchParams.get('pagina') || '1', 10));
    const limite = Math.min(100, Math.max(1, parseInt(searchParams.get('limite') || '20', 10)));
    const offset = (pagina - 1) * limite;

    // Métricas generales del dashboard
    const todosNegocios = await db.select({ id: negocios.id, estado: negocios.estado, creadoEn: negocios.creadoEn }).from(negocios).all();
    const metricas = {
      total: todosNegocios.length,
      pendientes: todosNegocios.filter((n) => n.estado === 'pendiente').length,
      aprobados: todosNegocios.filter((n) => n.estado === 'aprobado').length,
      rechazados: todosNegocios.filter((n) => n.estado === 'rechazado').length,
    };

    // Distribución por meses (últimos 6 meses)
    const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const mesesMap = new Map<string, number>();
    const ahora = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      mesesMap.set(key, 0);
    }
    for (const n of todosNegocios) {
      if (n.creadoEn) {
        const key = n.creadoEn.substring(0, 7);
        if (mesesMap.has(key)) {
          mesesMap.set(key, (mesesMap.get(key) || 0) + 1);
        }
      }
    }
    const statsPorMes = Array.from(mesesMap.entries()).map(([mesKey, count]) => {
      const [year, mStr] = mesKey.split('-');
      const mIdx = parseInt(mStr, 10) - 1;
      return {
        mes: mesKey,
        etiqueta: `${mesesNombres[mIdx]} ${year}`,
        count,
      };
    });

    // Distribución por categorías para gráficas
    const statsCats = await db
      .select({
        categoriaId: negocioCategorias.categoriaId,
        nombre: categorias.nombre,
        count: sql<number>`count(${negocioCategorias.negocioId})`,
      })
      .from(negocioCategorias)
      .innerJoin(categorias, eq(negocioCategorias.categoriaId, categorias.id))
      .groupBy(negocioCategorias.categoriaId, categorias.nombre)
      .all();

    // Obtener todas las categorías para los filtros del admin
    const todasLasCategorias = await db
      .select({ id: categorias.id, nombre: categorias.nombre, slug: categorias.slug })
      .from(categorias)
      .orderBy(categorias.nombre)
      .all();

    // Filtros de la consulta principal
    const condiciones = [];

    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    if (fechaDesde) {
      condiciones.push(sql`${negocios.creadoEn} >= ${fechaDesde}`);
    }
    if (fechaHasta) {
      condiciones.push(sql`${negocios.creadoEn} <= ${fechaHasta + 'T23:59:59Z'}`);
    }

    if (estado && ['pendiente', 'aprobado', 'rechazado'].includes(estado)) {
      condiciones.push(eq(negocios.estado, estado as any));
    }

    if (tipo && ['empresa', 'persona_natural'].includes(tipo)) {
      condiciones.push(eq(negocios.tipo, tipo as any));
    }

    if (categoriaId) {
      const rels = await db
        .select({ negocioId: negocioCategorias.negocioId })
        .from(negocioCategorias)
        .where(eq(negocioCategorias.categoriaId, categoriaId))
        .all();
      const idsDeCat = rels.map((r) => r.negocioId);
      if (idsDeCat.length === 0) {
        return NextResponse.json({
          negocios: [],
          total: 0,
          pagina,
          limite,
          totalPaginas: 0,
          metricas,
          statsPorCategoria: statsCats,
        });
      }
      condiciones.push(inArray(negocios.id, idsDeCat));
    }

    if (q) {
      const busquedaSql = sql`LOWER(${negocios.nombreNegocio} || ' ' || COALESCE(${negocios.correo}, '') || ' ' || COALESCE(${negocios.telefono}, '') || ' ' || COALESCE(${negocios.responsable}, '') || ' ' || COALESCE(${negocios.documento}, '')) LIKE ${`%${q}%`}`;
      condiciones.push(busquedaSql);
    }

    const whereClause = condiciones.length > 0 ? and(...condiciones) : undefined;

    // Conteo total para paginación
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(negocios)
      .where(whereClause)
      .get();
    const totalFiltrado = countResult?.count || 0;
    const totalPaginas = Math.ceil(totalFiltrado / limite);

    // Lista paginada
    const lista = await db
      .select()
      .from(negocios)
      .where(whereClause)
      .orderBy(desc(negocios.creadoEn))
      .limit(limite)
      .offset(offset)
      .all();

    const ids = lista.map((n) => n.id);
    let imagenes: Array<{ negocioId: string; url: string; orden: number }> = [];
    let relCategorias: Array<{ negocioId: string; id: number; nombre: string; slug: string }> = [];

    if (ids.length > 0) {
      imagenes = await db
        .select({
          negocioId: negocioImagenes.negocioId,
          url: negocioImagenes.url,
          orden: negocioImagenes.orden,
        })
        .from(negocioImagenes)
        .where(inArray(negocioImagenes.negocioId, ids))
        .all();

      relCategorias = await db
        .select({
          negocioId: negocioCategorias.negocioId,
          id: categorias.id,
          nombre: categorias.nombre,
          slug: categorias.slug,
        })
        .from(negocioCategorias)
        .innerJoin(categorias, eq(negocioCategorias.categoriaId, categorias.id))
        .where(inArray(negocioCategorias.negocioId, ids))
        .all();
    }

    const negociosCompletos = lista.map((item) => ({
      ...item,
      tiposAtencion: item.tiposAtencion ? JSON.parse(item.tiposAtencion) : [],
      serviciosDestacados: item.serviciosDestacados ? JSON.parse(item.serviciosDestacados) : [],
      imagenes: imagenes.filter((img) => img.negocioId === item.id),
      categorias: relCategorias.filter((cat) => cat.negocioId === item.id),
    }));

    return NextResponse.json({
      negocios: negociosCompletos,
      total: totalFiltrado,
      pagina,
      limite,
      totalPaginas,
      metricas,
      statsPorCategoria: statsCats,
      statsPorMes,
      categorias: todasLasCategorias,
    });
  } catch (error) {
    console.error('Error en listado admin de negocios:', error);
    return NextResponse.json({ error: 'Error al consultar registros de administración.' }, { status: 500 });
  }
}

// Acciones Masivas (Aprobar, Rechazar, Eliminar)
export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseReady();
    const admin = await obtenerSesionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const body = await req.json();
    const validacion = accionMasivaSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json(
        { error: validacion.error.issues[0]?.message || 'Datos de acción masiva no válidos.' },
        { status: 400 }
      );
    }

    const { ids, accion, motivoRechazo } = validacion.data;
    const ahoraIso = new Date().toISOString();

    const negociosAfectados = await db
      .select({
        id: negocios.id,
        nombreNegocio: negocios.nombreNegocio,
        correo: negocios.correo,
      })
      .from(negocios)
      .where(inArray(negocios.id, ids))
      .all();

    if (accion === 'aprobar') {
      await db
        .update(negocios)
        .set({
          estado: 'aprobado',
          aprobadoEn: ahoraIso,
          aprobadoPor: admin.usuario,
          motivoRechazo: null,
          actualizadoEn: ahoraIso,
        })
        .where(inArray(negocios.id, ids));

      // Notificaciones de aprobación
      for (const neg of negociosAfectados) {
        try {
          await notificarAprobacionNegocio({
            id: neg.id,
            nombreNegocio: neg.nombreNegocio,
            correo: neg.correo,
          });
        } catch {}
      }

      await db.insert(auditoria).values({
        id: crypto.randomUUID(),
        adminId: admin.adminId,
        accion: 'aprobar_masivo',
        entidad: 'negocio',
        detalle: `Aprobación masiva de ${ids.length} negocios`,
        fecha: ahoraIso,
      });

      return NextResponse.json({
        success: true,
        message: `${ids.length} registros aprobados exitosamente.`,
      });
    }

    if (accion === 'rechazar') {
      await db
        .update(negocios)
        .set({
          estado: 'rechazado',
          motivoRechazo: motivoRechazo?.trim() || 'No cumple los requisitos.',
          actualizadoEn: ahoraIso,
        })
        .where(inArray(negocios.id, ids));

      for (const neg of negociosAfectados) {
        try {
          await notificarRechazoNegocio({
            nombreNegocio: neg.nombreNegocio,
            correo: neg.correo,
            motivoRechazo,
          });
        } catch {}
      }

      await db.insert(auditoria).values({
        id: crypto.randomUUID(),
        adminId: admin.adminId,
        accion: 'rechazar_masivo',
        entidad: 'negocio',
        detalle: `Rechazo masivo de ${ids.length} negocios. Motivo: ${motivoRechazo}`,
        fecha: ahoraIso,
      });

      return NextResponse.json({
        success: true,
        message: `${ids.length} registros rechazados exitosamente.`,
      });
    }

    if (accion === 'eliminar') {
      // Obtener imágenes para borrarlas de Vercel Blob
      const imagenesABorrar = await db
        .select({ url: negocioImagenes.url, pathname: negocioImagenes.blobPathname })
        .from(negocioImagenes)
        .where(inArray(negocioImagenes.negocioId, ids))
        .all();

      for (const img of imagenesABorrar) {
        try {
          await eliminarImagenBlob(img.url, img.pathname || undefined);
        } catch {}
      }

      await db.delete(negocios).where(inArray(negocios.id, ids));

      await db.insert(auditoria).values({
        id: crypto.randomUUID(),
        adminId: admin.adminId,
        accion: 'eliminar_masivo',
        entidad: 'negocio',
        detalle: `Eliminación masiva de ${ids.length} negocios`,
        fecha: ahoraIso,
      });

      return NextResponse.json({
        success: true,
        message: `${ids.length} registros eliminados permanentemente.`,
      });
    }

    return NextResponse.json({ error: 'Acción no soportada.' }, { status: 400 });
  } catch (error) {
    console.error('Error en acción masiva:', error);
    return NextResponse.json({ error: 'Error ejecutando la acción masiva.' }, { status: 500 });
  }
}

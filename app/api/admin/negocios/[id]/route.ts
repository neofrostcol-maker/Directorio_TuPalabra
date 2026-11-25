import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { db } from '@/lib/db';
import { ensureDatabaseReady } from '@/lib/db/bootstrap';
import {
  negocios,
  negocioImagenes,
  negocioCategorias,
  auditoria,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { obtenerSesionAdmin } from '@/lib/auth/jwt';
import { notificarAprobacionNegocio, notificarRechazoNegocio } from '@/lib/email';
import { eliminarImagenBlob } from '@/lib/storage/blob';
import { normalizarUrlExterna } from '@/lib/utils';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseReady();
    const admin = await obtenerSesionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const negocioExistente = await db
      .select()
      .from(negocios)
      .where(eq(negocios.id, id))
      .get();

    if (!negocioExistente) {
      return NextResponse.json({ error: 'Negocio no encontrado.' }, { status: 404 });
    }

    const ahoraIso = new Date().toISOString();

    // 1. Caso cambio de estado directo
    if (body.accion === 'cambiar_estado') {
      const nuevoEstado = body.estado;
      const motivoRechazo = body.motivoRechazo;

      if (!['pendiente', 'aprobado', 'rechazado'].includes(nuevoEstado)) {
        return NextResponse.json({ error: 'Estado no válido.' }, { status: 400 });
      }

      if (nuevoEstado === 'rechazado' && (!motivoRechazo || motivoRechazo.trim().length === 0)) {
        return NextResponse.json(
          { error: 'Debes proporcionar un motivo de rechazo.' },
          { status: 400 }
        );
      }

      await db
        .update(negocios)
        .set({
          estado: nuevoEstado,
          motivoRechazo: nuevoEstado === 'rechazado' ? motivoRechazo.trim() : null,
          aprobadoEn: nuevoEstado === 'aprobado' ? ahoraIso : null,
          aprobadoPor: nuevoEstado === 'aprobado' ? admin.usuario : null,
          actualizadoEn: ahoraIso,
        })
        .where(eq(negocios.id, id));

      if (nuevoEstado === 'aprobado') {
        try {
          await notificarAprobacionNegocio({
            id: negocioExistente.id,
            nombreNegocio: negocioExistente.nombreNegocio,
            correo: negocioExistente.correo,
          });
        } catch {}
      } else if (nuevoEstado === 'rechazado') {
        try {
          await notificarRechazoNegocio({
            nombreNegocio: negocioExistente.nombreNegocio,
            correo: negocioExistente.correo,
            motivoRechazo,
          });
        } catch {}
      }

      await db.insert(auditoria).values({
        id: crypto.randomUUID(),
        adminId: admin.adminId,
        accion: `cambio_estado_${nuevoEstado}`,
        entidad: 'negocio',
        entidadId: id,
        detalle: `Estado cambiado a ${nuevoEstado}. Negocio: ${negocioExistente.nombreNegocio}`,
        fecha: ahoraIso,
      });

      return NextResponse.json({ success: true, message: `Estado actualizado a ${nuevoEstado}.` });
    }

    // 2. Caso edición de datos del negocio por parte del administrador
    if (body.accion === 'editar') {
      await db
        .update(negocios)
        .set({
          nombreNegocio: body.nombreNegocio || negocioExistente.nombreNegocio,
          tipo: body.tipo || negocioExistente.tipo,
          direccion: body.direccion || negocioExistente.direccion,
          telefono: body.telefono || negocioExistente.telefono,
          correo: body.correo || negocioExistente.correo,
          descripcionCorta: body.descripcionCorta ?? negocioExistente.descripcionCorta,
          descripcionLarga: body.descripcionLarga ?? negocioExistente.descripcionLarga,
          responsable: body.responsable ?? negocioExistente.responsable,
          documento: body.documento ?? negocioExistente.documento,
          ciudad: body.ciudad ?? negocioExistente.ciudad,
          barrio: body.barrio ?? negocioExistente.barrio,
          sitioWeb: body.sitioWeb !== undefined ? normalizarUrlExterna(body.sitioWeb) : negocioExistente.sitioWeb,
          instagram: body.instagram ?? negocioExistente.instagram,
          facebook: body.facebook ?? negocioExistente.facebook,
          tiktok: body.tiktok ?? negocioExistente.tiktok,
          catalogoUrl: body.catalogoUrl !== undefined ? normalizarUrlExterna(body.catalogoUrl) : negocioExistente.catalogoUrl,
          horario: body.horario ?? negocioExistente.horario,
          anioFundacion: body.anioFundacion ?? negocioExistente.anioFundacion,
          tiposAtencion: body.tiposAtencion ? JSON.stringify(body.tiposAtencion) : negocioExistente.tiposAtencion,
          serviciosDestacados: body.serviciosDestacados ? JSON.stringify(body.serviciosDestacados) : negocioExistente.serviciosDestacados,
          promocionMiembros: body.promocionMiembros ?? negocioExistente.promocionMiembros,
          esMiembroIglesia: typeof body.esMiembroIglesia === 'boolean' ? body.esMiembroIglesia : negocioExistente.esMiembroIglesia,
          actualizadoEn: ahoraIso,
        })
        .where(eq(negocios.id, id));

      // Actualizar categorías si se enviaron
      if (Array.isArray(body.categoriasIds) && body.categoriasIds.length > 0 && body.categoriasIds.length <= 5) {
        await db.delete(negocioCategorias).where(eq(negocioCategorias.negocioId, id));
        for (const catId of body.categoriasIds) {
          await db.insert(negocioCategorias).values({
            negocioId: id,
            categoriaId: catId,
          });
        }
      }

      await db.insert(auditoria).values({
        id: crypto.randomUUID(),
        adminId: admin.adminId,
        accion: 'editar',
        entidad: 'negocio',
        entidadId: id,
        detalle: `Edición de datos del negocio: ${negocioExistente.nombreNegocio}`,
        fecha: ahoraIso,
      });

      return NextResponse.json({ success: true, message: 'Datos del negocio actualizados exitosamente.' });
    }

    return NextResponse.json({ error: 'Acción no especificada.' }, { status: 400 });
  } catch (error) {
    console.error('Error al actualizar negocio:', error);
    return NextResponse.json({ error: 'Error al actualizar el registro.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseReady();
    const admin = await obtenerSesionAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { id } = await params;
    const ahoraIso = new Date().toISOString();

    const negocio = await db.select().from(negocios).where(eq(negocios.id, id)).get();
    if (!negocio) {
      return NextResponse.json({ error: 'Negocio no encontrado.' }, { status: 404 });
    }

    // Obtener imágenes para eliminarlas de Blob
    const imagenes = await db
      .select({ url: negocioImagenes.url, pathname: negocioImagenes.blobPathname })
      .from(negocioImagenes)
      .where(eq(negocioImagenes.negocioId, id))
      .all();

    for (const img of imagenes) {
      try {
        await eliminarImagenBlob(img.url, img.pathname || undefined);
      } catch {}
    }

    await db.delete(negocios).where(eq(negocios.id, id));

    await db.insert(auditoria).values({
      id: crypto.randomUUID(),
      adminId: admin.adminId,
      accion: 'eliminar',
      entidad: 'negocio',
      entidadId: id,
      detalle: `Eliminación de negocio: ${negocio.nombreNegocio} (${negocio.correo})`,
      fecha: ahoraIso,
    });

    return NextResponse.json({ success: true, message: 'Negocio eliminado exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar negocio:', error);
    return NextResponse.json({ error: 'Error al eliminar el negocio.' }, { status: 500 });
  }
}

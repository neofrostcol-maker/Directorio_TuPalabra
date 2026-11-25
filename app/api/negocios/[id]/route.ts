import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { negocios, negocioImagenes, negocioCategorias, categorias } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { obtenerSesionAdmin } from '@/lib/auth/jwt';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminSesion = await obtenerSesionAdmin();

    const negocio = await db
      .select()
      .from(negocios)
      .where(eq(negocios.id, id))
      .get();

    if (!negocio) {
      return NextResponse.json({ error: 'Negocio no encontrado.' }, { status: 404 });
    }

    // Si no es admin y no está aprobado, no permitir ver
    if (!adminSesion && negocio.estado !== 'aprobado') {
      return NextResponse.json(
        { error: 'El negocio no está disponible públicamente.' },
        { status: 404 }
      );
    }

    // Obtener imágenes ordenadas
    const imagenes = await db
      .select({
        id: negocioImagenes.id,
        url: negocioImagenes.url,
        orden: negocioImagenes.orden,
      })
      .from(negocioImagenes)
      .where(eq(negocioImagenes.negocioId, id))
      .orderBy(asc(negocioImagenes.orden))
      .all();

    // Obtener categorías
    const categoriasRel = await db
      .select({
        id: categorias.id,
        nombre: categorias.nombre,
        slug: categorias.slug,
        descripcion: categorias.descripcion,
      })
      .from(negocioCategorias)
      .innerJoin(categorias, eq(negocioCategorias.categoriaId, categorias.id))
      .where(eq(negocioCategorias.negocioId, id))
      .all();

    // Si es público, proteger datos privados (documento, ipRegistro, motivoRechazo)
    const datosPublicos = {
      id: negocio.id,
      tipo: negocio.tipo,
      nombreNegocio: negocio.nombreNegocio,
      direccion: negocio.direccion,
      telefono: negocio.telefono,
      correo: negocio.correo,
      descripcionCorta: negocio.descripcionCorta,
      descripcionLarga: negocio.descripcionLarga,
      responsable: negocio.responsable,
      ciudad: negocio.ciudad,
      barrio: negocio.barrio,
      sitioWeb: negocio.sitioWeb,
      instagram: negocio.instagram,
      facebook: negocio.facebook,
      tiktok: negocio.tiktok,
      catalogoUrl: negocio.catalogoUrl,
      horario: negocio.horario,
      anioFundacion: negocio.anioFundacion,
      tiposAtencion: negocio.tiposAtencion ? JSON.parse(negocio.tiposAtencion) : [],
      serviciosDestacados: negocio.serviciosDestacados
        ? JSON.parse(negocio.serviciosDestacados)
        : [],
      promocionMiembros: negocio.promocionMiembros,
      esMiembroIglesia: negocio.esMiembroIglesia,
      logoUrl: negocio.logoUrl,
      creadoEn: negocio.creadoEn,
      imagenes,
      categorias: categoriasRel,
      // Solo para admin:
      ...(adminSesion
        ? {
            documento: negocio.documento,
            estado: negocio.estado,
            motivoRechazo: negocio.motivoRechazo,
            aprobadoEn: negocio.aprobadoEn,
            aprobadoPor: negocio.aprobadoPor,
            ipRegistro: negocio.ipRegistro,
          }
        : {}),
    };

    return NextResponse.json(datosPublicos);
  } catch (error) {
    console.error('Error al obtener negocio por ID:', error);
    return NextResponse.json({ error: 'Error al consultar el negocio.' }, { status: 500 });
  }
}

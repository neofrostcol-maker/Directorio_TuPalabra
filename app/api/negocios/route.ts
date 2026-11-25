import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { db } from '@/lib/db';
import { ensureDatabaseReady } from '@/lib/db/bootstrap';
import {
  negocios,
  negocioImagenes,
  negocioCategorias,
  categorias,
} from '@/lib/db/schema';
import { eq, and, sql, desc, asc, inArray } from 'drizzle-orm';
import {
  registroNegocioSchema,
  normalizarTelefonoColombia,
} from '@/lib/validations/negocio';
import { verificarLimiteRegistro } from '@/lib/rate-limit';
import { notificarNuevoRegistroAdmin } from '@/lib/email';
import { normalizarUrlExterna } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseReady();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const categoriaSlug = searchParams.get('categoria') || '';
    const tipo = searchParams.get('tipo') || '';
    const ciudad = searchParams.get('ciudad') || '';
    const soloMiembros = searchParams.get('miembro') === 'true';
    const orden = searchParams.get('orden') || 'recientes';
    const pagina = Math.max(1, parseInt(searchParams.get('pagina') || '1', 10));
    const limite = Math.min(50, Math.max(1, parseInt(searchParams.get('limite') || '12', 10)));
    const offset = (pagina - 1) * limite;

    // Negocios con estado 'aprobado'
    const condiciones = [eq(negocios.estado, 'aprobado')];

    if (tipo === 'empresa' || tipo === 'persona_natural') {
      condiciones.push(eq(negocios.tipo, tipo));
    }

    if (soloMiembros) {
      condiciones.push(eq(negocios.esMiembroIglesia, true));
    }

    if (ciudad) {
      condiciones.push(eq(negocios.ciudad, ciudad));
    }

    if (q) {
      const busquedaSql = sql`LOWER(${negocios.nombreNegocio} || ' ' || COALESCE(${negocios.descripcionCorta}, '') || ' ' || COALESCE(${negocios.descripcionLarga}, '') || ' ' || COALESCE(${negocios.serviciosDestacados}, '') || ' ' || COALESCE(${negocios.ciudad}, '') || ' ' || COALESCE(${negocios.barrio}, '')) LIKE ${`%${q}%`}`;
      condiciones.push(busquedaSql);
    }

    // Filtrar por categoría si se especifica
    let negociosIdsFiltrados: string[] | null = null;
    if (categoriaSlug) {
      const categoriasArray = categoriaSlug.split(',').filter(Boolean);
      const catRecords = await db
        .select({ id: categorias.id })
        .from(categorias)
        .where(inArray(categorias.slug, categoriasArray))
        .all();

      if (catRecords.length > 0) {
        const catIds = catRecords.map((c) => c.id);
        const rels = await db
          .select({ negocioId: negocioCategorias.negocioId })
          .from(negocioCategorias)
          .where(inArray(negocioCategorias.categoriaId, catIds))
          .all();

        negociosIdsFiltrados = rels.map((r) => r.negocioId);
        if (negociosIdsFiltrados.length === 0) {
          return NextResponse.json({
            negocios: [],
            total: 0,
            pagina,
            limite,
            totalPaginas: 0,
          });
        }
        condiciones.push(inArray(negocios.id, negociosIdsFiltrados));
      }
    }

    const whereClause = and(...condiciones);

    // Conteo total
    const totalCountQuery = await db
      .select({ count: sql<number>`count(*)` })
      .from(negocios)
      .where(whereClause)
      .get();

    const total = totalCountQuery?.count || 0;
    const totalPaginas = Math.ceil(total / limite);

    // Consulta de negocios ordenados
    const orderByClause = orden === 'az' ? asc(negocios.nombreNegocio) : desc(negocios.creadoEn);

    const resultados = await db
      .select({
        id: negocios.id,
        tipo: negocios.tipo,
        nombreNegocio: negocios.nombreNegocio,
        direccion: negocios.direccion,
        telefono: negocios.telefono,
        correo: negocios.correo,
        descripcionCorta: negocios.descripcionCorta,
        ciudad: negocios.ciudad,
        barrio: negocios.barrio,
        horario: negocios.horario,
        tiposAtencion: negocios.tiposAtencion,
        serviciosDestacados: negocios.serviciosDestacados,
        promocionMiembros: negocios.promocionMiembros,
        esMiembroIglesia: negocios.esMiembroIglesia,
        logoUrl: negocios.logoUrl,
        creadoEn: negocios.creadoEn,
      })
      .from(negocios)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limite)
      .offset(offset)
      .all();

    // Obtener imágenes y categorías para los negocios seleccionados
    const negocioIds = resultados.map((n) => n.id);
    let todasImagenes: Array<{ negocioId: string; url: string; orden: number }> = [];
    let todasCategorias: Array<{ id: number; negocioId: string; nombre: string; slug: string }> = [];

    if (negocioIds.length > 0) {
      todasImagenes = await db
        .select({
          negocioId: negocioImagenes.negocioId,
          url: negocioImagenes.url,
          orden: negocioImagenes.orden,
        })
        .from(negocioImagenes)
        .where(inArray(negocioImagenes.negocioId, negocioIds))
        .orderBy(asc(negocioImagenes.orden))
        .all();

      const catRels = await db
        .select({
          id: categorias.id,
          negocioId: negocioCategorias.negocioId,
          nombre: categorias.nombre,
          slug: categorias.slug,
        })
        .from(negocioCategorias)
        .innerJoin(categorias, eq(negocioCategorias.categoriaId, categorias.id))
        .where(inArray(negocioCategorias.negocioId, negocioIds))
        .all();

      todasCategorias = catRels;
    }

    const negociosConRelaciones = resultados.map((negocio) => {
      const imagenes = todasImagenes.filter((img) => img.negocioId === negocio.id);
      const cats = todasCategorias.filter((c) => c.negocioId === negocio.id);
      return {
        ...negocio,
        tiposAtencion: negocio.tiposAtencion ? JSON.parse(negocio.tiposAtencion) : [],
        serviciosDestacados: negocio.serviciosDestacados
          ? JSON.parse(negocio.serviciosDestacados)
          : [],
        imagenes,
        categorias: cats,
      };
    });

    return NextResponse.json({
      negocios: negociosConRelaciones,
      total,
      pagina,
      limite,
      totalPaginas,
    });
  } catch (error) {
    console.error('Error al listar negocios:', error);
    return NextResponse.json({ error: 'Error al consultar el directorio.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseReady();
    // 1. Obtener IP y aplicar rate limiting
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
    const rateCheck = verificarLimiteRegistro(ip);

    if (!rateCheck.permitido) {
      return NextResponse.json(
        {
          error: `Has superado el límite de registros permitidos por hora. Por favor espera ${rateCheck.esperaMinutos} minutos.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();

    // 2. Comprobación anti-spam Honeypot
    if (body.website_trap && body.website_trap.trim() !== '') {
      return NextResponse.json({ error: 'Solicitud no válida.' }, { status: 400 });
    }

    // 3. Validación de Zod
    const validacion = registroNegocioSchema.safeParse(body);
    if (!validacion.success) {
      const primerError = validacion.error.issues[0]?.message || 'Datos no válidos.';
      return NextResponse.json({ error: primerError, detalles: validacion.error.format() }, { status: 400 });
    }

    const data = validacion.data;

    // Normalizar teléfono
    const telNormalizado = normalizarTelefonoColombia(data.telefono);

    // 4. Crear registro de Negocio
    const nuevoId = crypto.randomUUID();
    const ahoraIso = new Date().toISOString();

    await db.insert(negocios).values({
      id: nuevoId,
      tipo: data.tipo,
      nombreNegocio: data.nombreNegocio.trim(),
      direccion: data.direccion.trim(),
      telefono: telNormalizado,
      correo: data.correo.trim().toLowerCase(),
      descripcionCorta: data.descripcionCorta?.trim() || null,
      descripcionLarga: data.descripcionLarga?.trim() || null,
      responsable: data.responsable?.trim() || null,
      documento: data.documento?.trim() || null, // Privado
      ciudad: data.ciudad?.trim() || 'Bogotá',
      barrio: data.barrio?.trim() || null,
      sitioWeb: normalizarUrlExterna(data.sitioWeb),
      instagram: data.instagram?.trim() || null,
      facebook: data.facebook?.trim() || null,
      tiktok: data.tiktok?.trim() || null,
      catalogoUrl: normalizarUrlExterna(data.catalogoUrl),
      horario: data.horario?.trim() || null,
      anioFundacion: data.anioFundacion?.trim() || null,
      tiposAtencion: JSON.stringify(data.tiposAtencion || []),
      serviciosDestacados: JSON.stringify(data.serviciosDestacados || []),
      promocionMiembros: data.promocionMiembros?.trim() || null,
      esMiembroIglesia: data.esMiembroIglesia,
      logoUrl: data.logoUrl || null,
      estado: 'pendiente',
      aceptaDatos: true,
      fechaAceptacionDatos: ahoraIso,
      ipRegistro: ipHash,
      creadoEn: ahoraIso,
      actualizadoEn: ahoraIso,
    });

    // 5. Insertar imágenes (3 a 5)
    for (let i = 0; i < data.imagenes.length; i++) {
      await db.insert(negocioImagenes).values({
        id: crypto.randomUUID(),
        negocioId: nuevoId,
        url: data.imagenes[i],
        orden: i,
        creadoEn: ahoraIso,
      });
    }

    // 6. Insertar categorías (1 a 5)
    for (const catId of data.categoriasIds) {
      await db.insert(negocioCategorias).values({
        negocioId: nuevoId,
        categoriaId: catId,
      });
    }

    // 7. Notificación al administrador
    try {
      await notificarNuevoRegistroAdmin({
        nombreNegocio: data.nombreNegocio,
        responsable: data.responsable,
        correo: data.correo,
        telefono: telNormalizado,
      });
    } catch (e) {
      console.warn('Error enviando notificación por correo:', e);
    }

    return NextResponse.json({
      success: true,
      id: nuevoId,
      message: 'Tu registro fue recibido y está pendiente de aprobación.',
    });
  } catch (error: any) {
    console.error('Error registrando negocio:', error);
    // Verificar si el error provino del trigger SQL de 5 categorías
    if (error?.message?.includes('Un negocio no puede tener más de 5')) {
      return NextResponse.json(
        { error: 'Un negocio no puede tener más de 5 categorías asociadas.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Ocurrió un error al procesar el registro del negocio. Intenta de nuevo.' },
      { status: 500 }
    );
  }
}

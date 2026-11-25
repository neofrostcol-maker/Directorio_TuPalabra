import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { db } from '../lib/db';
import { categorias, admins, negocios, negocioImagenes, negocioCategorias } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

export const CATEGORIAS_SEED = [
  {
    nombre: 'Comercio',
    slug: 'comercio',
    descripcion: 'Compra y venta de productos, comercio mayorista y minorista',
  },
  {
    nombre: 'Comercio electrónico',
    slug: 'comercio-electronico',
    descripcion: 'Venta por internet, tiendas virtuales, marketplace',
  },
  {
    nombre: 'Alimentos y bebidas',
    slug: 'alimentos-y-bebidas',
    descripcion: 'Restaurantes, comidas rápidas, cafeterías, bebidas, preparación de alimentos',
  },
  {
    nombre: 'Manufactura / Producción',
    slug: 'manufactura-produccion',
    descripcion: 'Fabricación, transformación y elaboración de productos',
  },
  {
    nombre: 'Servicios profesionales',
    slug: 'servicios-profesionales',
    descripcion: 'Consultoría, asesoría, ingeniería, contabilidad, servicios jurídicos',
  },
  {
    nombre: 'Tecnología / Software',
    slug: 'tecnologia-software',
    descripcion: 'Desarrollo de software, programación, sistemas, servicios informáticos',
  },
  {
    nombre: 'Publicidad y marketing',
    slug: 'publicidad-marketing',
    descripcion: 'Publicidad, marketing, diseño, gestión de campañas',
  },
  {
    nombre: 'Construcción',
    slug: 'construccion',
    descripcion: 'Obras, remodelaciones, instalaciones',
  },
  {
    nombre: 'Transporte y logística',
    slug: 'transporte-logistica',
    descripcion: 'Transporte de pasajeros, carga, mensajería, almacenamiento',
  },
  {
    nombre: 'Alojamiento y turismo',
    slug: 'alojamiento-turismo',
    descripcion: 'Hoteles, hostales, alojamiento turístico y actividades turísticas',
  },
  {
    nombre: 'Educación',
    slug: 'educacion',
    descripcion: 'Enseñanza, capacitación, formación',
  },
  {
    nombre: 'Salud',
    slug: 'salud',
    descripcion: 'Servicios médicos, odontología, laboratorios',
  },
  {
    nombre: 'Servicios personales',
    slug: 'servicios-personales',
    descripcion: 'Peluquería, belleza, cuidado personal',
  },
  {
    nombre: 'Mantenimiento y reparación',
    slug: 'mantenimiento-reparacion',
    descripcion: 'Vehículos, computadores, equipos y maquinaria',
  },
  {
    nombre: 'Actividades inmobiliarias',
    slug: 'actividades-inmobiliarias',
    descripcion: 'Arrendamiento, compra/venta y administración de inmuebles',
  },
  {
    nombre: 'Actividades financieras',
    slug: 'actividades-financieras',
    descripcion: 'Servicios financieros, seguros e intermediación',
  },
  {
    nombre: 'Agricultura y ganadería',
    slug: 'agricultura-ganaderia',
    descripcion: 'Cultivos, ganadería, producción agrícola y pecuaria',
  },
  {
    nombre: 'Industria',
    slug: 'industria',
    descripcion: 'Producción industrial y transformación de materias primas',
  },
  {
    nombre: 'Entretenimiento y recreación',
    slug: 'entretenimiento-recreacion',
    descripcion: 'Eventos, actividades recreativas, deportivas y culturales',
  },
  {
    nombre: 'Servicios empresariales',
    slug: 'servicios-empresariales',
    descripcion: 'Administración, apoyo empresarial, outsourcing',
  },
  {
    nombre: 'Telecomunicaciones',
    slug: 'telecomunicaciones',
    descripcion: 'Internet, telefonía, transmisión de datos',
  },
  {
    nombre: 'Actividades ambientales',
    slug: 'actividades-ambientales',
    descripcion: 'Gestión de residuos, tratamiento de aguas, saneamiento',
  },
  {
    nombre: 'Servicios de seguridad',
    slug: 'servicios-seguridad',
    descripcion: 'Vigilancia, seguridad privada',
  },
];

async function seed() {
  console.log('Iniciando poblamiento de datos (Seed)...');

  // 1. Sembrar Categorías de forma idempotente
  const mapCatId: Record<string, number> = {};
  for (const cat of CATEGORIAS_SEED) {
    const existing = await db
      .select()
      .from(categorias)
      .where(eq(categorias.slug, cat.slug))
      .get();

    if (!existing) {
      const inserted = await db
        .insert(categorias)
        .values({
          nombre: cat.nombre,
          slug: cat.slug,
          descripcion: cat.descripcion,
        })
        .returning({ id: categorias.id });
      mapCatId[cat.slug] = inserted[0]?.id;
    } else {
      mapCatId[cat.slug] = existing.id;
    }
  }
  console.log(`✅ 23 categorías verificadas/sembradas.`);

  // 2. Sembrar ÚNICO Administrador leyendo variables de entorno
  const adminUser = process.env.ADMIN_USER || 'AdminTuPalabra';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Iglesia2026+';
  const adminEmail = process.env.ADMIN_EMAIL || 'jhocamolu2010@gmail.com';

  const existingAdmin = await db
    .select()
    .from(admins)
    .where(eq(admins.usuario, adminUser))
    .get();

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  if (!existingAdmin) {
    await db.insert(admins).values({
      id: crypto.randomUUID(),
      usuario: adminUser,
      passwordHash,
      correo: adminEmail,
      creadoEn: new Date().toISOString(),
    });
    console.log(`✅ Administrador '${adminUser}' creado exitosamente.`);
  } else {
    // Actualizar hash si es necesario
    await db
      .update(admins)
      .set({ passwordHash, correo: adminEmail })
      .where(eq(admins.usuario, adminUser));
    console.log(`✅ Administrador '${adminUser}' verificado y actualizado.`);
  }

  // 3. Sembrar negocios de ejemplo si no hay ninguno
  const totalNegocios = await db.select().from(negocios).all();
  if (totalNegocios.length === 0) {
    console.log('Sembrando negocios aprobados de ejemplo...');

    const sample1Id = crypto.randomUUID();
    await db.insert(negocios).values({
      id: sample1Id,
      tipo: 'empresa',
      nombreNegocio: 'Panadería y Café Maná Celestial',
      direccion: 'Carrera 15 # 85-32, Chapinero',
      telefono: '+573105551234',
      correo: 'contacto@manacelestial.co',
      descripcionCorta: 'Panadería artesanal, repostería fina, desayunos y café de origen colombiano.',
      descripcionLarga: 'Somos una empresa familiar comprometida con la excelencia y la calidez en el servicio. Ofrecemos pan fresco horneado diariamente con masa madre, tortas personalizadas para eventos y café especial de fincas colombianas. Atendemos eventos y reuniones.',
      responsable: 'Carlos Andrés Mendoza',
      documento: '900.123.456-7',
      ciudad: 'Bogotá',
      barrio: 'Chapinero Norte',
      sitioWeb: 'https://manacelestial.co',
      instagram: '@manacelestialpanaderia',
      facebook: 'manacelestialpanaderia',
      tiktok: '',
      catalogoUrl: 'https://manacelestial.co/menu',
      horario: 'Lunes a Sábado: 6:30 AM - 8:00 PM | Domingo: 7:00 AM - 2:00 PM',
      anioFundacion: '2019',
      tiposAtencion: JSON.stringify(['local_fisico', 'a_domicilio']),
      serviciosDestacados: JSON.stringify(['Pan de masa madre', 'Tortas para eventos', 'Café especial', 'Desayunos']),
      promocionMiembros: '15% de descuento en pedidos para reuniones y 10% en cafetería los fines de semana presentando comprobante de congregación.',
      esMiembroIglesia: true,
      logoUrl: 'https://picsum.photos/seed/mana-cafe/300/300',
      estado: 'aprobado',
      aceptaDatos: true,
      fechaAceptacionDatos: new Date().toISOString(),
      creadoEn: new Date(Date.now() - 7 * 86400000).toISOString(),
      actualizadoEn: new Date().toISOString(),
      aprobadoEn: new Date().toISOString(),
      aprobadoPor: adminUser,
    });

    // 3 imágenes
    await db.insert(negocioImagenes).values([
      {
        id: crypto.randomUUID(),
        negocioId: sample1Id,
        url: 'https://picsum.photos/seed/bakery1/800/600',
        orden: 0,
      },
      {
        id: crypto.randomUUID(),
        negocioId: sample1Id,
        url: 'https://picsum.photos/seed/bakery2/800/600',
        orden: 1,
      },
      {
        id: crypto.randomUUID(),
        negocioId: sample1Id,
        url: 'https://picsum.photos/seed/bakery3/800/600',
        orden: 2,
      },
    ]);

    if (mapCatId['alimentos-y-bebidas']) {
      await db.insert(negocioCategorias).values({
        negocioId: sample1Id,
        categoriaId: mapCatId['alimentos-y-bebidas'],
      });
    }
    if (mapCatId['comercio']) {
      await db.insert(negocioCategorias).values({
        negocioId: sample1Id,
        categoriaId: mapCatId['comercio'],
      });
    }

    // Negocio 2: Consultoría y Software
    const sample2Id = crypto.randomUUID();
    await db.insert(negocios).values({
      id: sample2Id,
      tipo: 'persona_natural',
      nombreNegocio: 'Gracia & Verdad Soluciones Digitales',
      direccion: 'Calle 100 # 19A-40, Edificio Titanium',
      telefono: '+573209876543',
      correo: 'info@graciayverdad.tech',
      descripcionCorta: 'Desarrollo web moderno, aplicaciones móviles y marketing digital enfocado en resultados.',
      descripcionLarga: 'Ayudamos a pequeños y medianos emprendedores a transformar su presencia digital. Creamos sitios web optimizados, tiendas virtuales Shopify/WooCommerce, automatización de WhatsApp Business y posicionamiento en redes sociales.',
      responsable: 'Laura Sofía Gómez',
      documento: '1020304050',
      ciudad: 'Bogotá',
      barrio: 'Chicó',
      sitioWeb: 'https://graciayverdad.tech',
      instagram: '@graciayverdadtech',
      facebook: '',
      tiktok: '@graciayverdad_tech',
      catalogoUrl: '',
      horario: 'Lunes a Viernes: 8:00 AM - 6:00 PM',
      anioFundacion: '2021',
      tiposAtencion: JSON.stringify(['en_linea', 'a_domicilio']),
      serviciosDestacados: JSON.stringify(['Páginas Web', 'Tiendas Virtuales', 'Marketing Digital', 'Soporte Técnico']),
      promocionMiembros: 'Diagnóstico digital gratuito y 20% de descuento en desarrollo web para miembros de Tu Palabra.',
      esMiembroIglesia: true,
      logoUrl: 'https://picsum.photos/seed/digital-agency/300/300',
      estado: 'aprobado',
      aceptaDatos: true,
      fechaAceptacionDatos: new Date().toISOString(),
      creadoEn: new Date(Date.now() - 3 * 86400000).toISOString(),
      actualizadoEn: new Date().toISOString(),
      aprobadoEn: new Date().toISOString(),
      aprobadoPor: adminUser,
    });

    await db.insert(negocioImagenes).values([
      {
        id: crypto.randomUUID(),
        negocioId: sample2Id,
        url: 'https://picsum.photos/seed/tech1/800/600',
        orden: 0,
      },
      {
        id: crypto.randomUUID(),
        negocioId: sample2Id,
        url: 'https://picsum.photos/seed/tech2/800/600',
        orden: 1,
      },
      {
        id: crypto.randomUUID(),
        negocioId: sample2Id,
        url: 'https://picsum.photos/seed/tech3/800/600',
        orden: 2,
      },
    ]);

    if (mapCatId['tecnologia-software']) {
      await db.insert(negocioCategorias).values({
        negocioId: sample2Id,
        categoriaId: mapCatId['tecnologia-software'],
      });
    }
    if (mapCatId['publicidad-marketing']) {
      await db.insert(negocioCategorias).values({
        negocioId: sample2Id,
        categoriaId: mapCatId['publicidad-marketing'],
      });
    }

    // Negocio 3: Mantenimiento y Mecánica
    const sample3Id = crypto.randomUUID();
    await db.insert(negocios).values({
      id: sample3Id,
      tipo: 'empresa',
      nombreNegocio: 'Servicio Técnico Automotriz La Roca',
      direccion: 'Avenida Boyacá # 68-15',
      telefono: '+573154448899',
      correo: 'tallerlaroca@gmail.com',
      descripcionCorta: 'Mantenimiento preventivo, sincronización electrónica, frenos y mecánica en general con honestidad garantizada.',
      descripcionLarga: 'Taller automotriz con más de 12 años de trayectoria en Bogotá. Nos caracterizamos por el trabajo honesto, repuestos garantizados y diagnóstico computarizado con scanner de última generación. Servicio express para cambios de aceite y frenos.',
      responsable: 'Felipe Jaramillo',
      documento: '901.456.789-1',
      ciudad: 'Bogotá',
      barrio: 'Normandía',
      sitioWeb: '',
      instagram: '@tallermecanicoleroca',
      facebook: '',
      tiktok: '',
      catalogoUrl: '',
      horario: 'Lunes a Viernes: 7:30 AM - 5:30 PM | Sábados: 8:00 AM - 2:00 PM',
      anioFundacion: '2012',
      tiposAtencion: JSON.stringify(['local_fisico', 'a_domicilio']),
      serviciosDestacados: JSON.stringify(['Sincronización', 'Frenos y Suspensión', 'Escaneo Computarizado', 'Cambio de Aceite']),
      promocionMiembros: 'Revisión y escaneo de viaje gratuito antes de salir en familia.',
      esMiembroIglesia: true,
      logoUrl: 'https://picsum.photos/seed/auto-service/300/300',
      estado: 'aprobado',
      aceptaDatos: true,
      fechaAceptacionDatos: new Date().toISOString(),
      creadoEn: new Date(Date.now() - 1 * 86400000).toISOString(),
      actualizadoEn: new Date().toISOString(),
      aprobadoEn: new Date().toISOString(),
      aprobadoPor: adminUser,
    });

    await db.insert(negocioImagenes).values([
      {
        id: crypto.randomUUID(),
        negocioId: sample3Id,
        url: 'https://picsum.photos/seed/mechanic1/800/600',
        orden: 0,
      },
      {
        id: crypto.randomUUID(),
        negocioId: sample3Id,
        url: 'https://picsum.photos/seed/mechanic2/800/600',
        orden: 1,
      },
      {
        id: crypto.randomUUID(),
        negocioId: sample3Id,
        url: 'https://picsum.photos/seed/mechanic3/800/600',
        orden: 2,
      },
      {
        id: crypto.randomUUID(),
        negocioId: sample3Id,
        url: 'https://picsum.photos/seed/mechanic4/800/600',
        orden: 3,
      },
    ]);

    if (mapCatId['mantenimiento-reparacion']) {
      await db.insert(negocioCategorias).values({
        negocioId: sample3Id,
        categoriaId: mapCatId['mantenimiento-reparacion'],
      });
    }

    console.log('✅ Negocios de prueba sembrados exitosamente.');
  }

  console.log('Seed completado con éxito.');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error en seed:', err);
    process.exit(1);
  });

import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { client, db } from './index';
import {
  admins,
  categorias,
  negocioCategorias,
  negocioImagenes,
  negocios,
} from './schema';
import { CATEGORIAS_OFICIALES } from '../constants/categorias';

declare global {
  var __db_bootstrap_promise: Promise<void> | undefined;
}

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS negocios (
    id text PRIMARY KEY NOT NULL,
    tipo text NOT NULL CHECK(tipo IN ('empresa', 'persona_natural')),
    nombre_negocio text NOT NULL,
    direccion text NOT NULL,
    telefono text NOT NULL,
    correo text NOT NULL,
    descripcion_corta text,
    descripcion_larga text,
    responsable text,
    documento text,
    ciudad text,
    barrio text,
    sitio_web text,
    instagram text,
    facebook text,
    tiktok text,
    catalogo_url text,
    horario text,
    anio_fundacion text,
    tipos_atencion text DEFAULT '[]',
    servicios_destacados text DEFAULT '[]',
    promocion_miembros text,
    es_miembro_iglesia integer NOT NULL DEFAULT 0,
    logo_url text,
    estado text NOT NULL DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'aprobado', 'rechazado')),
    motivo_rechazo text,
    acepta_datos integer NOT NULL,
    fecha_aceptacion_datos text NOT NULL,
    ip_registro text,
    creado_en text NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    actualizado_en text NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    aprobado_en text,
    aprobado_por text
  )`,
  `CREATE TABLE IF NOT EXISTS negocio_imagenes (
    id text PRIMARY KEY NOT NULL,
    negocio_id text NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
    url text NOT NULL,
    blob_pathname text,
    orden integer NOT NULL DEFAULT 0,
    creado_en text NOT NULL DEFAULT (CURRENT_TIMESTAMP)
  )`,
  `CREATE TABLE IF NOT EXISTS categorias (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    nombre text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE,
    descripcion text NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS negocio_categorias (
    negocio_id text NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
    categoria_id integer NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
    PRIMARY KEY (negocio_id, categoria_id)
  )`,
  `CREATE TABLE IF NOT EXISTS admins (
    id text PRIMARY KEY NOT NULL,
    usuario text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    correo text NOT NULL,
    creado_en text NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    ultimo_login text
  )`,
  `CREATE TABLE IF NOT EXISTS auditoria (
    id text PRIMARY KEY NOT NULL,
    admin_id text,
    accion text NOT NULL,
    entidad text NOT NULL,
    entidad_id text,
    detalle text,
    fecha text NOT NULL DEFAULT (CURRENT_TIMESTAMP)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_negocios_estado ON negocios (estado)`,
  `CREATE INDEX IF NOT EXISTS idx_negocios_nombre ON negocios (nombre_negocio)`,
  `CREATE INDEX IF NOT EXISTS idx_negocios_creado_en ON negocios (creado_en)`,
  `CREATE INDEX IF NOT EXISTS idx_negocio_categorias_cat ON negocio_categorias (categoria_id)`,
  `CREATE INDEX IF NOT EXISTS idx_negocio_imagenes_negocio ON negocio_imagenes (negocio_id)`,
  `CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria (fecha)`,
  `CREATE TRIGGER IF NOT EXISTS trg_max_5_categorias_before_insert
   BEFORE INSERT ON negocio_categorias
   FOR EACH ROW
   WHEN (
     SELECT COUNT(*) FROM negocio_categorias WHERE negocio_id = NEW.negocio_id
   ) >= 5
   BEGIN
     SELECT RAISE(ABORT, 'Un negocio no puede tener más de 5 categorías asociadas.');
   END`,
];

async function inicializarYSeedingSiVacio() {
  // 1. Verificar si ya existen tablas básicas
  const check = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='negocios'"
  );

  if (check.rows.length === 0) {
    for (const stmt of SCHEMA_STATEMENTS) {
      await client.execute(stmt);
    }
  }

  // 2. Sembrar 23 categorías si está vacía la tabla
  const catCountRes = await client.execute('SELECT COUNT(*) as c FROM categorias');
  const catCount = Number(catCountRes.rows[0]?.c ?? 0);

  if (catCount === 0) {
    for (const cat of CATEGORIAS_OFICIALES) {
      await db
        .insert(categorias)
        .values({
          id: cat.id,
          nombre: cat.nombre,
          slug: cat.slug,
          descripcion: cat.descripcion,
        })
        .onConflictDoNothing();
    }
  }

  // 3. Sembrar admin por defecto si no existe ninguno
  const adminCountRes = await client.execute('SELECT COUNT(*) as c FROM admins');
  const adminCount = Number(adminCountRes.rows[0]?.c ?? 0);
  const adminUser = process.env.ADMIN_USER || 'AdminTuPalabra';

  if (adminCount === 0) {
    const adminPassword = process.env.ADMIN_PASSWORD || 'Iglesia2026+';
    const adminEmail = process.env.ADMIN_EMAIL || 'jhocamolu2010@gmail.com';
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    await db.insert(admins).values({
      id: crypto.randomUUID(),
      usuario: adminUser,
      passwordHash,
      correo: adminEmail,
      creadoEn: new Date().toISOString(),
    });
  }

  // 4. Sembrar negocios Demo si no hay ninguno (para garantizar Vercel Demo funcional desde el segundo 1)
  const negCountRes = await client.execute('SELECT COUNT(*) as c FROM negocios');
  const negCount = Number(negCountRes.rows[0]?.c ?? 0);

  if (negCount === 0) {
    const ahora = Date.now();
    const ahoraIso = new Date(ahora).toISOString();

    const sample1Id = crypto.randomUUID();
    await db.insert(negocios).values({
      id: sample1Id,
      tipo: 'empresa',
      nombreNegocio: 'Panadería y Café Maná Celestial',
      direccion: 'Carrera 15 # 85-32, Chapinero',
      telefono: '+573105551234',
      correo: 'contacto@manacelestial.co',
      descripcionCorta:
        'Panadería artesanal, repostería fina, desayunos y café de origen colombiano.',
      descripcionLarga:
        'Somos una empresa familiar comprometida con la excelencia y la calidez en el servicio. Ofrecemos pan fresco horneado diariamente con masa madre, tortas personalizadas para eventos y café especial de fincas colombianas.',
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
      serviciosDestacados: JSON.stringify([
        'Pan de masa madre',
        'Tortas para eventos',
        'Café especial',
        'Desayunos',
      ]),
      promocionMiembros:
        '15% de descuento en pedidos para reuniones y 10% en cafetería los fines de semana presentando comprobante de congregación.',
      esMiembroIglesia: true,
      logoUrl: 'https://picsum.photos/seed/mana-cafe/300/300',
      estado: 'aprobado',
      aceptaDatos: true,
      fechaAceptacionDatos: ahoraIso,
      creadoEn: new Date(ahora - 7 * 86400000).toISOString(),
      actualizadoEn: ahoraIso,
      aprobadoEn: ahoraIso,
      aprobadoPor: adminUser,
    });

    await db.insert(negocioImagenes).values([
      { id: crypto.randomUUID(), negocioId: sample1Id, url: 'https://picsum.photos/seed/bakery1/800/600', orden: 0 },
      { id: crypto.randomUUID(), negocioId: sample1Id, url: 'https://picsum.photos/seed/bakery2/800/600', orden: 1 },
      { id: crypto.randomUUID(), negocioId: sample1Id, url: 'https://picsum.photos/seed/bakery3/800/600', orden: 2 },
    ]);
    await db.insert(negocioCategorias).values([
      { negocioId: sample1Id, categoriaId: 3 },
      { negocioId: sample1Id, categoriaId: 1 },
    ]);

    const sample2Id = crypto.randomUUID();
    await db.insert(negocios).values({
      id: sample2Id,
      tipo: 'persona_natural',
      nombreNegocio: 'Gracia & Verdad Soluciones Digitales',
      direccion: 'Calle 100 # 19A-40, Edificio Titanium',
      telefono: '+573209876543',
      correo: 'info@graciayverdad.tech',
      descripcionCorta:
        'Desarrollo web moderno, aplicaciones móviles y marketing digital enfocado en resultados.',
      descripcionLarga:
        'Ayudamos a pequeños y medianos emprendedores a transformar su presencia digital. Creamos sitios web optimizados, tiendas virtuales y posicionamiento en redes sociales.',
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
      serviciosDestacados: JSON.stringify([
        'Páginas Web',
        'Tiendas Virtuales',
        'Marketing Digital',
        'Soporte Técnico',
      ]),
      promocionMiembros:
        'Diagnóstico digital gratuito y 20% de descuento en desarrollo web para miembros de Tu Palabra.',
      esMiembroIglesia: true,
      logoUrl: 'https://picsum.photos/seed/digital-agency/300/300',
      estado: 'aprobado',
      aceptaDatos: true,
      fechaAceptacionDatos: ahoraIso,
      creadoEn: new Date(ahora - 3 * 86400000).toISOString(),
      actualizadoEn: ahoraIso,
      aprobadoEn: ahoraIso,
      aprobadoPor: adminUser,
    });

    await db.insert(negocioImagenes).values([
      { id: crypto.randomUUID(), negocioId: sample2Id, url: 'https://picsum.photos/seed/tech1/800/600', orden: 0 },
      { id: crypto.randomUUID(), negocioId: sample2Id, url: 'https://picsum.photos/seed/tech2/800/600', orden: 1 },
      { id: crypto.randomUUID(), negocioId: sample2Id, url: 'https://picsum.photos/seed/tech3/800/600', orden: 2 },
    ]);
    await db.insert(negocioCategorias).values([
      { negocioId: sample2Id, categoriaId: 6 },
      { negocioId: sample2Id, categoriaId: 7 },
    ]);

    const sample3Id = crypto.randomUUID();
    await db.insert(negocios).values({
      id: sample3Id,
      tipo: 'empresa',
      nombreNegocio: 'Servicio Técnico Automotriz La Roca',
      direccion: 'Avenida Boyacá # 68-15',
      telefono: '+573154448899',
      correo: 'tallerlaroca@gmail.com',
      descripcionCorta:
        'Mantenimiento preventivo, sincronización electrónica, frenos y mecánica en general con honestidad garantizada.',
      descripcionLarga:
        'Taller automotriz con más de 12 años de trayectoria en Bogotá. Nos caracterizamos por el trabajo honesto, repuestos garantizados y diagnóstico computarizado.',
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
      serviciosDestacados: JSON.stringify([
        'Sincronización',
        'Frenos y Suspensión',
        'Escaneo Computarizado',
        'Cambio de Aceite',
      ]),
      promocionMiembros: 'Revisión y escaneo de viaje gratuito antes de salir en familia.',
      esMiembroIglesia: true,
      logoUrl: 'https://picsum.photos/seed/auto-service/300/300',
      estado: 'aprobado',
      aceptaDatos: true,
      fechaAceptacionDatos: ahoraIso,
      creadoEn: new Date(ahora - 1 * 86400000).toISOString(),
      actualizadoEn: ahoraIso,
      aprobadoEn: ahoraIso,
      aprobadoPor: adminUser,
    });

    await db.insert(negocioImagenes).values([
      { id: crypto.randomUUID(), negocioId: sample3Id, url: 'https://picsum.photos/seed/mechanic1/800/600', orden: 0 },
      { id: crypto.randomUUID(), negocioId: sample3Id, url: 'https://picsum.photos/seed/mechanic2/800/600', orden: 1 },
      { id: crypto.randomUUID(), negocioId: sample3Id, url: 'https://picsum.photos/seed/mechanic3/800/600', orden: 2 },
      { id: crypto.randomUUID(), negocioId: sample3Id, url: 'https://picsum.photos/seed/mechanic4/800/600', orden: 3 },
    ]);
    await db.insert(negocioCategorias).values([
      { negocioId: sample3Id, categoriaId: 14 },
    ]);

    // Negocio 4 de demostración en estado pendiente para moderación inmediata en el Panel Admin
    const sample4Id = crypto.randomUUID();
    await db.insert(negocios).values({
      id: sample4Id,
      tipo: 'persona_natural',
      nombreNegocio: 'Odontología Integral Sonrisa de Paz',
      direccion: 'Calle 127 # 20-45, Consultorio 304',
      telefono: '+573187654321',
      correo: 'citas@sonrisadepaz.co',
      descripcionCorta:
        'Odontología general, estética dental, ortodoncia y odontopediatría con calidez familiar.',
      descripcionLarga:
        'Consultorio odontológico atendido por profesionales cristianos dedicados al cuidado integral de la salud oral para niños, jóvenes y adultos.',
      responsable: 'Dra. Mariana Castillo',
      documento: '52.890.123-4',
      ciudad: 'Bogotá',
      barrio: 'Usaquén',
      sitioWeb: '',
      instagram: '@sonrisadepaz_odontologia',
      facebook: '',
      tiktok: '',
      catalogoUrl: '',
      horario: 'Lunes a Sábado: 8:00 AM - 6:00 PM',
      anioFundacion: '2020',
      tiposAtencion: JSON.stringify(['local_fisico']),
      serviciosDestacados: JSON.stringify([
        'Valoración Inicial',
        'Limpieza Dental',
        'Ortodoncia',
        'Odontopediatría',
      ]),
      promocionMiembros: 'Valoración diagnóstica sin costo y 15% de descuento en higiene oral.',
      esMiembroIglesia: true,
      logoUrl: 'https://picsum.photos/seed/dental-peace/300/300',
      estado: 'pendiente',
      aceptaDatos: true,
      fechaAceptacionDatos: ahoraIso,
      creadoEn: ahoraIso,
      actualizadoEn: ahoraIso,
    });

    await db.insert(negocioImagenes).values([
      { id: crypto.randomUUID(), negocioId: sample4Id, url: 'https://picsum.photos/seed/dental1/800/600', orden: 0 },
      { id: crypto.randomUUID(), negocioId: sample4Id, url: 'https://picsum.photos/seed/dental2/800/600', orden: 1 },
      { id: crypto.randomUUID(), negocioId: sample4Id, url: 'https://picsum.photos/seed/dental3/800/600', orden: 2 },
    ]);
    await db.insert(negocioCategorias).values([
      { negocioId: sample4Id, categoriaId: 12 },
    ]);
  }
}

export async function ensureDatabaseReady(): Promise<void> {
  if (!global.__db_bootstrap_promise) {
    global.__db_bootstrap_promise = inicializarYSeedingSiVacio().catch((err) => {
      global.__db_bootstrap_promise = undefined;
      console.error('Error en bootstrap de base de datos:', err);
    });
  }
  await global.__db_bootstrap_promise;
}

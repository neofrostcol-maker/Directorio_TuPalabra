import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index, primaryKey } from 'drizzle-orm/sqlite-core';

// 1. Tabla de Negocios
export const negocios = sqliteTable(
  'negocios',
  {
    id: text('id').primaryKey(), // UUID
    tipo: text('tipo', { enum: ['empresa', 'persona_natural'] }).notNull(),
    nombreNegocio: text('nombre_negocio').notNull(),
    direccion: text('direccion').notNull(),
    telefono: text('telefono').notNull(), // Formato colombiano: +57 o 10 dígitos
    correo: text('correo').notNull(),
    descripcionCorta: text('descripcion_corta'), // Máx 160 caracteres
    descripcionLarga: text('descripcion_larga'), // Máx 1000 caracteres
    responsable: text('responsable'),
    documento: text('documento'), // NIT o cédula (PRIVADO, nunca público)
    ciudad: text('ciudad'),
    barrio: text('barrio'),
    sitioWeb: text('sitio_web'),
    instagram: text('instagram'),
    facebook: text('facebook'),
    tiktok: text('tiktok'),
    catalogoUrl: text('catalogo_url'),
    horario: text('horario'),
    anioFundacion: text('anio_fundacion'),
    tiposAtencion: text('tipos_atencion').default('[]'), // JSON array: ["local_fisico", "a_domicilio", "en_linea"]
    serviciosDestacados: text('servicios_destacados').default('[]'), // JSON array de etiquetas
    promocionMiembros: text('promocion_miembros'),
    esMiembroIglesia: integer('es_miembro_iglesia', { mode: 'boolean' }).default(false).notNull(),
    logoUrl: text('logo_url'),
    estado: text('estado', { enum: ['pendiente', 'aprobado', 'rechazado'] })
      .default('pendiente')
      .notNull(),
    motivoRechazo: text('motivo_rechazo'),
    aceptaDatos: integer('acepta_datos', { mode: 'boolean' }).notNull(),
    fechaAceptacionDatos: text('fecha_aceptacion_datos').notNull(),
    ipRegistro: text('ip_registro'), // Hash anónimo de IP
    creadoEn: text('creado_en').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    actualizadoEn: text('actualizado_en').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    aprobadoEn: text('aprobado_en'),
    aprobadoPor: text('aprobado_por'),
  },
  (table) => [
    index('idx_negocios_estado').on(table.estado),
    index('idx_negocios_nombre').on(table.nombreNegocio),
    index('idx_negocios_creado_en').on(table.creadoEn),
  ]
);

// 2. Tabla de Imágenes del Negocio (3 a 5 fotos obligatorias)
export const negocioImagenes = sqliteTable(
  'negocio_imagenes',
  {
    id: text('id').primaryKey(),
    negocioId: text('negocio_id')
      .notNull()
      .references(() => negocios.id, { onDelete: 'cascade' }),
    url: text('url').notNull(), // URL pública de Vercel Blob
    blobPathname: text('blob_pathname'),
    orden: integer('orden').notNull().default(0),
    creadoEn: text('creado_en').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  },
  (table) => [
    index('idx_negocio_imagenes_negocio').on(table.negocioId),
  ]
);

// 3. Tabla de Categorías (23 categorías oficiales)
export const categorias = sqliteTable(
  'categorias',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    nombre: text('nombre').notNull().unique(),
    slug: text('slug').notNull().unique(),
    descripcion: text('descripcion').notNull(),
  }
);

// 4. Tabla de Relación Negocio - Categorías (1 a 5 por negocio)
export const negocioCategorias = sqliteTable(
  'negocio_categorias',
  {
    negocioId: text('negocio_id')
      .notNull()
      .references(() => negocios.id, { onDelete: 'cascade' }),
    categoriaId: integer('categoria_id')
      .notNull()
      .references(() => categorias.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.negocioId, table.categoriaId] }),
    index('idx_negocio_categorias_cat').on(table.categoriaId),
  ]
);

// 5. Tabla de Administradores (Único Administrador)
export const admins = sqliteTable(
  'admins',
  {
    id: text('id').primaryKey(),
    usuario: text('usuario').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    correo: text('correo').notNull(),
    creadoEn: text('creado_en').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    ultimoLogin: text('ultimo_login'),
  }
);

// 6. Tabla de Auditoría
export const auditoria = sqliteTable(
  'auditoria',
  {
    id: text('id').primaryKey(),
    adminId: text('admin_id'),
    accion: text('accion').notNull(), // 'aprobar' | 'rechazar' | 'eliminar' | 'editar' | 'login' | 'cambio_password'
    entidad: text('entidad').notNull(), // 'negocio' | 'admin'
    entidadId: text('entidad_id'),
    detalle: text('detalle'),
    fecha: text('fecha').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  },
  (table) => [
    index('idx_auditoria_fecha').on(table.fecha),
  ]
);

// Tipos inferidos de Drizzle
export type Negocio = typeof negocios.$inferSelect;
export type NuevoNegocio = typeof negocios.$inferInsert;
export type NegocioImagen = typeof negocioImagenes.$inferSelect;
export type Categoria = typeof categorias.$inferSelect;
export type Admin = typeof admins.$inferSelect;
export type Auditoria = typeof auditoria.$inferSelect;

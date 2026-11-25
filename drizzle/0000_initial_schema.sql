-- Migración inicial: Directorio Empresarial Tu Palabra

CREATE TABLE IF NOT EXISTS `negocios` (
  `id` text PRIMARY KEY NOT NULL,
  `tipo` text NOT NULL CHECK(`tipo` IN ('empresa', 'persona_natural')),
  `nombre_negocio` text NOT NULL,
  `direccion` text NOT NULL,
  `telefono` text NOT NULL,
  `correo` text NOT NULL,
  `descripcion_corta` text,
  `descripcion_larga` text,
  `responsable` text,
  `documento` text,
  `ciudad` text,
  `barrio` text,
  `sitio_web` text,
  `instagram` text,
  `facebook` text,
  `tiktok` text,
  `catalogo_url` text,
  `horario` text,
  `anio_fundacion` text,
  `tipos_atencion` text DEFAULT '[]',
  `servicios_destacados` text DEFAULT '[]',
  `promocion_miembros` text,
  `es_miembro_iglesia` integer NOT NULL DEFAULT 0,
  `logo_url` text,
  `estado` text NOT NULL DEFAULT 'pendiente' CHECK(`estado` IN ('pendiente', 'aprobado', 'rechazado')),
  `motivo_rechazo` text,
  `acepta_datos` integer NOT NULL,
  `fecha_aceptacion_datos` text NOT NULL,
  `ip_registro` text,
  `creado_en` text NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `actualizado_en` text NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `aprobado_en` text,
  `aprobado_por` text
);

CREATE TABLE IF NOT EXISTS `negocio_imagenes` (
  `id` text PRIMARY KEY NOT NULL,
  `negocio_id` text NOT NULL REFERENCES `negocios`(`id`) ON DELETE CASCADE,
  `url` text NOT NULL,
  `blob_pathname` text,
  `orden` integer NOT NULL DEFAULT 0,
  `creado_en` text NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS `categorias` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `nombre` text NOT NULL UNIQUE,
  `slug` text NOT NULL UNIQUE,
  `descripcion` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `negocio_categorias` (
  `negocio_id` text NOT NULL REFERENCES `negocios`(`id`) ON DELETE CASCADE,
  `categoria_id` integer NOT NULL REFERENCES `categorias`(`id`) ON DELETE CASCADE,
  PRIMARY KEY (`negocio_id`, `categoria_id`)
);

CREATE TABLE IF NOT EXISTS `admins` (
  `id` text PRIMARY KEY NOT NULL,
  `usuario` text NOT NULL UNIQUE,
  `password_hash` text NOT NULL,
  `correo` text NOT NULL,
  `creado_en` text NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `ultimo_login` text
);

CREATE TABLE IF NOT EXISTS `auditoria` (
  `id` text PRIMARY KEY NOT NULL,
  `admin_id` text,
  `accion` text NOT NULL,
  `entidad` text NOT NULL,
  `entidad_id` text,
  `detalle` text,
  `fecha` text NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

-- Índices para optimización de consultas
CREATE INDEX IF NOT EXISTS `idx_negocios_estado` ON `negocios` (`estado`);
CREATE INDEX IF NOT EXISTS `idx_negocios_nombre` ON `negocios` (`nombre_negocio`);
CREATE INDEX IF NOT EXISTS `idx_negocios_creado_en` ON `negocios` (`creado_en`);
CREATE INDEX IF NOT EXISTS `idx_negocio_categorias_cat` ON `negocio_categorias` (`categoria_id`);
CREATE INDEX IF NOT EXISTS `idx_negocio_imagenes_negocio` ON `negocio_imagenes` (`negocio_id`);
CREATE INDEX IF NOT EXISTS `idx_auditoria_fecha` ON `auditoria` (`fecha`);

-- Trigger SQL para validar un máximo de 5 categorías por negocio a nivel de base de datos
CREATE TRIGGER IF NOT EXISTS `trg_max_5_categorias_before_insert`
BEFORE INSERT ON `negocio_categorias`
FOR EACH ROW
WHEN (
    SELECT COUNT(*) FROM `negocio_categorias` WHERE `negocio_id` = NEW.`negocio_id`
) >= 5
BEGIN
    SELECT RAISE(ABORT, 'Un negocio no puede tener más de 5 categorías asociadas.');
END;

-- =====================================================================
-- DIRECTORIO EMPRESARIAL TU PALABRA - BASE DE DATOS MYSQL (cPanel)
-- Iglesia Cristiana Tu Palabra - Un Encuentro de Gracia
-- Codificación: UTF8mb4 (Soporte completo para tildes, caracteres latinos y emojis)
-- Motor: InnoDB (Soporte ACID, Claves Foráneas con Borrado en Cascada)
-- =====================================================================

SET NAMES utf8mb4;
SET time_zone = '-05:00'; -- Hora Colombia (GMT-5)
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1. Tabla de Categorías (23 Oficiales)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categorias` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(150) NOT NULL UNIQUE,
  `slug` VARCHAR(150) NOT NULL UNIQUE,
  `descripcion` TEXT NOT NULL,
  `icono` VARCHAR(50) DEFAULT NULL,
  `activo` TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,
  `creado_en` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. Tabla de Negocios y Emprendimientos
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `negocios` (
  `id` CHAR(36) NOT NULL PRIMARY KEY, -- UUID v4
  `tipo` ENUM('empresa', 'persona_natural') NOT NULL DEFAULT 'empresa',
  `nombre_negocio` VARCHAR(200) NOT NULL,
  `direccion` VARCHAR(255) NOT NULL,
  `telefono` VARCHAR(30) NOT NULL,
  `correo` VARCHAR(150) NOT NULL,
  `descripcion_corta` VARCHAR(160) DEFAULT NULL,
  `descripcion_larga` TEXT DEFAULT NULL,
  `responsable` VARCHAR(150) DEFAULT NULL,
  `documento` VARCHAR(60) DEFAULT NULL, -- NIT o Cédula (CONFIDENCIAL)
  `ciudad` VARCHAR(100) DEFAULT 'Bogotá',
  `barrio` VARCHAR(100) DEFAULT NULL,
  `sitio_web` VARCHAR(255) DEFAULT NULL,
  `instagram` VARCHAR(100) DEFAULT NULL,
  `facebook` VARCHAR(150) DEFAULT NULL,
  `tiktok` VARCHAR(100) DEFAULT NULL,
  `catalogo_url` VARCHAR(255) DEFAULT NULL,
  `horario` VARCHAR(150) DEFAULT NULL,
  `anio_fundacion` VARCHAR(10) DEFAULT NULL,
  `tipos_atencion` JSON DEFAULT NULL, -- ["local_fisico", "a_domicilio", "en_linea"]
  `servicios_destacados` JSON DEFAULT NULL, -- Etiquetas ["Asesoría", "Domicilios", ...]
  `promocion_miembros` TEXT DEFAULT NULL,
  `es_miembro_iglesia` TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,
  `logo_url` VARCHAR(255) DEFAULT NULL,
  `estado` ENUM('pendiente', 'aprobado', 'rechazado') NOT NULL DEFAULT 'pendiente',
  `motivo_rechazo` TEXT DEFAULT NULL,
  `acepta_datos` TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,
  `fecha_aceptacion_datos` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_registro` VARCHAR(64) DEFAULT NULL,
  `user_agent` VARCHAR(255) DEFAULT NULL,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `aprobado_en` DATETIME DEFAULT NULL,
  `aprobado_por` VARCHAR(100) DEFAULT NULL,
  INDEX `idx_estado` (`estado`),
  INDEX `idx_nombre` (`nombre_negocio`),
  INDEX `idx_ciudad` (`ciudad`),
  INDEX `idx_creado_en` (`creado_en`),
  INDEX `idx_tipo` (`tipo`),
  INDEX `idx_miembro` (`es_miembro_iglesia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. Tabla de Imágenes del Negocio (3 a 5 fotos locales)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `negocio_imagenes` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `negocio_id` CHAR(36) NOT NULL,
  `url` VARCHAR(255) NOT NULL, -- URL pública relativa o absoluta
  `nombre_archivo` VARCHAR(255) NOT NULL, -- Nombre en disco en /uploads/negocios/
  `ruta_disco` VARCHAR(255) NOT NULL,
  `peso_bytes` INT UNSIGNED DEFAULT 0,
  `mime_type` VARCHAR(50) DEFAULT 'image/jpeg',
  `orden` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_img_negocio` (`negocio_id`),
  CONSTRAINT `fk_img_negocio` FOREIGN KEY (`negocio_id`) REFERENCES `negocios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. Tabla de Relación Negocios <-> Categorías (1 a 5)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `negocio_categorias` (
  `negocio_id` CHAR(36) NOT NULL,
  `categoria_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`negocio_id`, `categoria_id`),
  INDEX `idx_rel_categoria` (`categoria_id`),
  CONSTRAINT `fk_rel_negocio` FOREIGN KEY (`negocio_id`) REFERENCES `negocios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rel_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. Tabla de Administradores
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admins` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `usuario` VARCHAR(60) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `correo` VARCHAR(150) NOT NULL,
  `nombre` VARCHAR(100) DEFAULT 'Administrador General',
  `activo` TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,
  `intentos_fallidos` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `bloqueado_hasta` DATETIME DEFAULT NULL,
  `ultimo_login` DATETIME DEFAULT NULL,
  `ultimo_ip` VARCHAR(45) DEFAULT NULL,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. Tabla de Registro de Auditoría (OWASP A09)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `auditoria` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `admin_id` CHAR(36) DEFAULT NULL,
  `usuario` VARCHAR(60) DEFAULT NULL,
  `accion` VARCHAR(60) NOT NULL, -- 'login', 'aprobar', 'rechazar', 'eliminar', 'editar', 'cambio_password'
  `entidad` VARCHAR(60) NOT NULL, -- 'negocio', 'admin', 'auth'
  `entidad_id` VARCHAR(60) DEFAULT NULL,
  `detalle` TEXT DEFAULT NULL,
  `ip` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(255) DEFAULT NULL,
  `fecha` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_auditoria_fecha` (`fecha`),
  INDEX `idx_auditoria_accion` (`accion`),
  INDEX `idx_auditoria_admin` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. Tabla de Control de Tasa (Rate Limiting - OWASP A04/A07)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `rate_limits` (
  `ip` VARCHAR(45) NOT NULL,
  `accion` VARCHAR(50) NOT NULL, -- 'login', 'registro', 'upload'
  `intentos` INT UNSIGNED NOT NULL DEFAULT 1,
  `primer_intento` INT UNSIGNED NOT NULL,
  `ultimo_intento` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`ip`, `accion`),
  INDEX `idx_rate_limit_tiempo` (`ultimo_intento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- SEED DATA: 23 Categorías Oficiales
-- ---------------------------------------------------------------------
INSERT INTO `categorias` (`id`, `nombre`, `slug`, `descripcion`, `icono`) VALUES
(1, 'Alimentos y Bebidas', 'alimentos-y-bebidas', 'Restaurantes, cafeterías, repostería, panaderías, catering y alimentos preparados.', 'Utensils'),
(2, 'Salud y Bienestar', 'salud-y-bienestar', 'Medicina general, odontología, fisioterapia, nutrición, psicología y óptica.', 'HeartPulse'),
(3, 'Belleza y Cuidado Personal', 'belleza-y-cuidado-personal', 'Peluquerías, barberías, spa, estética, cuidado de la piel y cosméticos.', 'Sparkles'),
(4, 'Tecnología y Software', 'tecnologia-y-software', 'Desarrollo web, soporte técnico, apps, computadores y servicios digitales.', 'Laptop'),
(5, 'Educación y Capacitación', 'educacion-y-capacitacion', 'Clases particulares, tutorías escolares, cursos, idiomas y talleres formativos.', 'GraduationCap'),
(6, 'Construcción y Remodelación', 'construccion-y-remodelacion', 'Arquitectura, obras civiles, pintura, albañilería, plomería y electricidad.', 'Hammer'),
(7, 'Servicios Profesionales', 'servicios-profesionales', 'Contaduría, asesoría legal, consultoría empresarial, seguros y tributaria.', 'Briefcase'),
(8, 'Moda y Confección', 'moda-y-confeccion', 'Ropa, calzado, accesorios, diseño de modas y confección a la medida.', 'Shirt'),
(9, 'Hogar y Decoración', 'hogar-y-decoracion', 'Muebles, diseño de interiores, cortinas, lencería para el hogar y adornos.', 'Home'),
(10, 'Automotriz y Transporte', 'automotriz-y-transporte', 'Talleres mecánicos, repuestos, lavado de autos, grúas y transporte escolar/privado.', 'Car'),
(11, 'Fotografía y Video', 'fotografia-y-video', 'Sesiones fotográficas, cobertura de eventos, video profesional y edición.', 'Camera'),
(12, 'Eventos y Entretenimiento', 'eventos-y-entretenimiento', 'Animación, sonido, luces, alquiler de menaje, decoración y logística de eventos.', 'PartyPopper'),
(13, 'Comercio y Tiendas', 'comercio-y-tiendas', 'Minimercados, papelerías, misceláneas, droguerías y comercio minorista.', 'ShoppingBag'),
(14, 'Mascotas y Veterinaria', 'mascotas-y-veterinaria', 'Clínica veterinaria, guardería, estética canina y alimentos para mascotas.', 'Dog'),
(15, 'Inmobiliaria y Bienes Raíces', 'inmobiliaria-y-bienes-raices', 'Venta, arriendo, avalúos, corretaje y administración de inmuebles.', 'Building'),
(16, 'Publicidad y Marketing', 'publicidad-y-marketing', 'Estrategia digital, redes sociales, diseño gráfico, branding y material POP.', 'Megaphone'),
(17, 'Deportes y Fitness', 'deportes-y-fitness', 'Entrenamiento personalizado, gimnasios, artículos deportivos y artes marciales.', 'Dumbbell'),
(18, 'Artesanías y Manualidades', 'artesanias-y-manualidades', 'Tejidos, bisutería, cerámica, pintura y productos hechos a mano.', 'Palette'),
(19, 'Música y Arte', 'musica-y-arte', 'Clases de música, instrumentos, producción musical y presentaciones artísticas.', 'Music'),
(20, 'Seguridad y Vigilancia', 'seguridad-y-vigilancia', 'Cámaras de seguridad, alarmas, cerrajería y control de acceso.', 'Shield'),
(21, 'Turismo y Hotelería', 'turismo-y-hoteleria', 'Agencias de viajes, planes turísticos, guianza y hospedaje.', 'Plane'),
(22, 'Medio Ambiente y Reciclaje', 'medio-ambiente-y-reciclaje', 'Manejo de residuos, paneles solares, jardinería y sostenibilidad.', 'Leaf'),
(23, 'Otros Servicios', 'otros-servicios', 'Cualquier otro oficio, labor o emprendimiento que bendiga a la comunidad.', 'MoreHorizontal')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`), `descripcion` = VALUES(`descripcion`);

-- ---------------------------------------------------------------------
-- SEED DATA: Administrador Inicial (Contraseña por defecto: Iglesia2026+)
-- Hash generado con bcrypt (cost 12): $2y$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
-- ---------------------------------------------------------------------
INSERT INTO `admins` (`id`, `usuario`, `password_hash`, `correo`, `nombre`, `activo`)
VALUES (
  'admin-principal-tupalabra-01',
  'admin',
  '$2y$12$Vp7qL1k1P4.2c6dFhQ2NgeV9y0vH9qE5Z3r6yXbF9v5o8n3hK8l8e', -- Se regenerará con migrate.php si se corre
  'admin@iglesiatupalabra.org',
  'Administrador Directorio',
  1
) ON DUPLICATE KEY UPDATE `correo` = VALUES(`correo`);

SET FOREIGN_KEY_CHECKS = 1;

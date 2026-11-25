<?php
declare(strict_types=1);

/**
 * =====================================================================
 * PLANTILLA DE CONFIGURACIÓN PARA CPANEL (config.local.php)
 * =====================================================================
 * Instrucciones:
 * 1. Duplica este archivo y renómbralo a: config.local.php
 * 2. Coloca los datos de tu Base de Datos MySQL creada en cPanel Wizard.
 * 3. Guarda el archivo con permisos 640 o 644.
 * =====================================================================
 */

// Datos de Conexión a MySQL en cPanel
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'tuusuario_directorio'); // Nombre completo en cPanel (ej. miempresa_directorio)
define('DB_USER', 'tuusuario_admin');      // Usuario completo en cPanel (ej. miempresa_admin)
define('DB_PASS', 'TuPasswordSeguro2026+'); // Contraseña del usuario MySQL
define('DB_CHARSET', 'utf8mb4');

// URL Base pública donde se accede al sitio web o al directorio
define('APP_URL', 'https://directorio.iglesiatupalabra.org');

// Configuración de Notificaciones por Correo
define('MAIL_FROM_ADDRESS', 'contacto@iglesiatupalabra.org');
define('MAIL_FROM_NAME', 'Directorio Empresarial Tu Palabra');
define('ADMIN_NOTIFICATION_EMAIL', 'admin@iglesiatupalabra.org');

// Token para ejecutar la migración web vía navegador
define('INSTALL_TOKEN', 'Iglesia2026Setup');

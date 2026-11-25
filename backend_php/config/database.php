<?php
declare(strict_types=1);

/**
 * =====================================================================
 * CONEXIÓN PDO A BASE DE DATOS MYSQL (cPanel / Servidor de Producción)
 * Directorio Empresarial Iglesia Cristiana Tu Palabra
 * OWASP A03: Injection - Prepared Statements obligatorios con emulación desactivada.
 * =====================================================================
 */

// Intentar cargar variables desde config.local.php si existe (fácil configuración en cPanel)
$localConfigFile = __DIR__ . '/config.local.php';
if (file_exists($localConfigFile)) {
    require_once $localConfigFile;
}

// Parámetros de conexión con fallbacks configurables
defined('DB_HOST')     || define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
defined('DB_PORT')     || define('DB_PORT', getenv('DB_PORT') ?: '3306');
defined('DB_NAME')     || define('DB_NAME', getenv('DB_NAME') ?: 'tupalabra_directorio');
defined('DB_USER')     || define('DB_USER', getenv('DB_USER') ?: 'tupalabra_user');
defined('DB_PASS')     || define('DB_PASS', getenv('DB_PASS') ?: 'Iglesia2026+');
defined('DB_CHARSET')  || define('DB_CHARSET', 'utf8mb4');

// URL Base del sitio (para URLs de imágenes subidas)
defined('APP_URL')     || define('APP_URL', getenv('APP_URL') ?: (
    (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') .
    '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost')
));

// Ruta física absoluta para el almacenamiento de imágenes
defined('UPLOADS_DIR') || define('UPLOADS_DIR', dirname(__DIR__) . '/uploads');

/**
 * Obtener instancia singleton de la conexión PDO
 *
 * @return PDO
 */
function getDBConnection(): PDO
{
    static $pdo = null;

    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            DB_HOST,
            DB_PORT,
            DB_NAME,
            DB_CHARSET
        );

        $options = [
            // Regla OWASP A03: Forzar excepciones en errores de base de datos
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            // Retornar arreglos asociativos por defecto
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            // CRÍTICO OWASP A03: Desactivar emulación de prepared statements (previene SQL Injection real)
            PDO::ATTR_EMULATE_PREPARES   => false,
            // Timeout de conexión estricto
            PDO::ATTR_TIMEOUT            => 5,
            // Forzar charset utf8mb4
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci, time_zone = '-05:00'",
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            // OWASP A05: Jamás exponer credenciales o trazas de error al cliente
            error_log('Error de conexión a MySQL: ' . $e->getMessage());
            http_response_code(500);
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode([
                'error' => 'Error de conexión con la base de datos. Por favor contacte al administrador.',
                'codigo' => 'DB_CONNECTION_ERROR'
            ]);
            exit;
        }
    }

    return $pdo;
}

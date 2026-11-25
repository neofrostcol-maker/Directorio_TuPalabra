<?php
declare(strict_types=1);

/**
 * =====================================================================
 * POLÍTICAS DE SEGURIDAD Y PROTECCIÓN OWASP TOP 10 (cPanel / PHP 8+)
 * Directorio Empresarial Iglesia Cristiana Tu Palabra
 * =====================================================================
 * A01: Broken Access Control (Sesiones protegidas y caducidad estricta)
 * A02: Cryptographic Failures (HTTPS, Cookies Seguras, Hashes robustos)
 * A03: Injection (Sanitización y control de parámetros)
 * A04: Insecure Design (Control de tasa / Rate Limiting, Honeypot)
 * A05: Security Misconfiguration (Cabeceras HTTP, sin fuga de trazas)
 * A07: Identification and Authentication Failures (Bloqueo por fuerza bruta)
 * A08: Software and Data Integrity Failures (Tokens y validación de tipos)
 * A09: Security Logging (Registro de eventos sospechosos)
 * =====================================================================
 */

// 1. Configuración de manejo de errores (OWASP A05: Ocultar detalles en producción)
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
error_reporting(E_ALL);
ini_set('log_errors', '1');

/**
 * 2. Aplicar Cabeceras de Seguridad HTTP (OWASP A05)
 */
function applySecurityHeaders(): void
{
    // Previene que navegadores interpreten archivos como un MIME distinto al declarado
    header('X-Content-Type-Options: nosniff');

    // Previene Clickjacking obligando a que solo se pueda embeber en el mismo dominio
    header('X-Frame-Options: SAMEORIGIN');

    // Activa el filtro anti-XSS en navegadores legados
    header('X-XSS-Protection: 1; mode=block');

    // Minimiza la información de referencia enviada a sitios de terceros
    header('Referrer-Policy: strict-origin-when-cross-origin');

    // Política de Seguridad de Contenido (CSP)
    header("Content-Security-Policy: default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;");

    // Restricción de permisos del navegador (Cámara, Micrófono, Geolocalización no utilizados)
    header('Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()');

    // Forzar HTTPS vía HSTS si la conexión es segura
    if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
    }

    // CORS controlado (Permite orígenes del mismo host o el configurado)
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin) {
        $allowedHosts = [
            parse_url(APP_URL, PHP_URL_HOST),
            $_SERVER['HTTP_HOST'] ?? '',
            'localhost:3000',
            'localhost'
        ];
        $originHost = parse_url($origin, PHP_URL_HOST);
        if (in_array($originHost, $allowedHosts, true)) {
            header("Access-Control-Allow-Origin: $origin");
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
        }
    }

    // Si es una petición OPTIONS (preflight), responder inmediatamente con 200 OK
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

/**
 * 3. Iniciar Sesión con Endurecimiento Estricto (OWASP A07 & A01)
 */
function startSecureSession(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $isHttps = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';

    // Parámetros de cookies de sesión seguros
    session_set_cookie_params([
        'lifetime' => 28800, // 8 horas máximo de sesión
        'path'     => '/',
        'domain'   => '',
        'secure'   => $isHttps, // Solo enviar por HTTPS en producción
        'httponly' => true,     // Impide robo de sesión vía JavaScript (XSS)
        'samesite' => 'Lax',    // Protección contra CSRF permitiendo navegación normal
    ]);

    // Opciones INI de seguridad
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.gc_maxlifetime', '28800');

    session_start();

    // Comprobación de expiración absoluta (8 horas) y de inactividad (2 horas)
    $ahora = time();
    if (isset($_SESSION['CREATED_AT']) && ($ahora - $_SESSION['CREATED_AT'] > 28800)) {
        session_unset();
        session_destroy();
        session_start();
    }
    $_SESSION['CREATED_AT'] = $_SESSION['CREATED_AT'] ?? $ahora;

    if (isset($_SESSION['LAST_ACTIVITY']) && ($ahora - $_SESSION['LAST_ACTIVITY'] > 7200)) {
        session_unset();
        session_destroy();
        session_start();
    }
    $_SESSION['LAST_ACTIVITY'] = $ahora;
}

/**
 * 4. Obtener IP real del cliente (con soporte para proxys de cPanel / Cloudflare)
 */
function getClientIP(): string
{
    $headers = [
        'HTTP_CF_CONNECTING_IP',
        'HTTP_X_REAL_IP',
        'HTTP_X_FORWARDED_FOR',
        'REMOTE_ADDR'
    ];

    foreach ($headers as $header) {
        if (!empty($_SERVER[$header])) {
            $ips = explode(',', $_SERVER[$header]);
            $ip = trim($ips[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }
    }

    return '127.0.0.1';
}

/**
 * 5. Control de Tasa / Rate Limiting en Base de Datos (OWASP A04 / A07)
 *
 * @param string $accion Nombre de la acción ('login', 'registro', 'upload')
 * @param int $maxIntentos Número máximo de intentos permitidos
 * @param int $ventanaSegundos Ventana de tiempo en segundos
 * @return bool True si está dentro del límite, False si debe bloquearse
 */
function checkRateLimit(string $accion, int $maxIntentos = 5, int $ventanaSegundos = 900): bool
{
    try {
        $pdo = getDBConnection();
        $ip = getClientIP();
        $ahora = time();

        $stmt = $pdo->prepare('SELECT intentos, primer_intento, ultimo_intento FROM rate_limits WHERE ip = ? AND accion = ?');
        $stmt->execute([$ip, $accion]);
        $row = $stmt->fetch();

        if ($row) {
            // Si la ventana ya expiró, reiniciar el contador
            if (($ahora - (int)$row['primer_intento']) > $ventanaSegundos) {
                $upd = $pdo->prepare('UPDATE rate_limits SET intentos = 1, primer_intento = ?, ultimo_intento = ? WHERE ip = ? AND accion = ?');
                $upd->execute([$ahora, $ahora, $ip, $accion]);
                return true;
            }

            // Si excede los intentos permitidos
            if ((int)$row['intentos'] >= $maxIntentos) {
                return false;
            }

            // Incrementar contador
            $upd = $pdo->prepare('UPDATE rate_limits SET intentos = intentos + 1, ultimo_intento = ? WHERE ip = ? AND accion = ?');
            $upd->execute([$ahora, $ip, $accion]);
            return true;
        }

        // Primer registro para esta IP y acción
        $ins = $pdo->prepare('INSERT INTO rate_limits (ip, accion, intentos, primer_intento, ultimo_intento) VALUES (?, ?, 1, ?, ?)');
        $ins->execute([$ip, $accion, $ahora, $ahora]);
        return true;
    } catch (Exception $e) {
        error_log('Error en checkRateLimit: ' . $e->getMessage());
        return true; // En caso de fallo de BD no bloquear al usuario legítimo
    }
}

/**
 * Resetear límite de tasa tras una acción exitosa (ej. login correcto)
 */
function resetRateLimit(string $accion): void
{
    try {
        $pdo = getDBConnection();
        $ip = getClientIP();
        $stmt = $pdo->prepare('DELETE FROM rate_limits WHERE ip = ? AND accion = ?');
        $stmt->execute([$ip, $accion]);
    } catch (Exception $e) {
        error_log('Error reseteando rate limit: ' . $e->getMessage());
    }
}

/**
 * 6. Generador de UUID v4 nativo en PHP
 */
function generateUUIDv4(): string
{
    $data = random_bytes(16);
    $data[6] = chr((ord($data[6]) & 0x0f) | 0x40); // set version to 0100
    $data[8] = chr((ord($data[8]) & 0x3f) | 0x80); // set bits 6-7 to 10
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

/**
 * 7. Limpieza y Sanitización de Datos (OWASP A03)
 */
function cleanString(?string $val, int $maxLength = 255): string
{
    if ($val === null) return '';
    $clean = trim($val);
    $clean = strip_tags($clean); // Elimina etiquetas HTML
    return mb_substr($clean, 0, $maxLength, 'UTF-8');
}

/**
 * 8. Respuestas JSON Estándar y Seguras
 */
function sendJsonResponse(int $statusCode, array $data): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

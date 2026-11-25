<?php
declare(strict_types=1);

/**
 * =====================================================================
 * HELPER DE AUTENTICACIÓN Y SESIONES DE ADMINISTRADOR (OWASP A01 & A07)
 * =====================================================================
 */

require_once dirname(__DIR__) . '/config/database.php';
require_once dirname(__DIR__) . '/config/security.php';
require_once __DIR__ . '/AuditLogger.php';

class Auth
{
    /**
     * Verificar si hay una sesión activa de administrador
     * Retorna los datos del admin o aborta con 401 Unauthorized
     */
    public static function requireAdmin(): array
    {
        applySecurityHeaders();
        startSecureSession();

        if (empty($_SESSION['admin_id'])) {
            sendJsonResponse(401, [
                'error' => 'No autorizado. Por favor inicie sesión.',
                'codigo' => 'UNAUTHORIZED'
            ]);
        }

        // Validar que el usuario aún exista y esté activo en la base de datos
        $pdo = getDBConnection();
        $stmt = $pdo->prepare('SELECT id, usuario, correo, nombre, activo FROM admins WHERE id = ? LIMIT 1');
        $stmt->execute([$_SESSION['admin_id']]);
        $admin = $stmt->fetch();

        if (!$admin || (int)$admin['activo'] !== 1) {
            self::logout();
            sendJsonResponse(401, [
                'error' => 'La sesión ha expirado o el usuario está inactivo.',
                'codigo' => 'SESSION_EXPIRED'
            ]);
        }

        return $admin;
    }

    /**
     * Intentar inicio de sesión con protección contra ataques de fuerza bruta
     */
    public static function login(string $usuario, string $password): array
    {
        applySecurityHeaders();
        startSecureSession();

        // 1. Regla OWASP A04/A07: Verificar límite de intentos (5 intentos en 15 minutos)
        if (!checkRateLimit('login', 5, 900)) {
            sendJsonResponse(429, [
                'error' => 'Demasiados intentos fallidos. Por seguridad, su acceso ha sido bloqueado temporalmente durante 15 minutos.',
                'codigo' => 'RATE_LIMIT_EXCEEDED'
            ]);
        }

        $usuario = trim($usuario);
        if ($usuario === '' || $password === '') {
            sendJsonResponse(400, [
                'error' => 'El usuario y la contraseña son requeridos.',
                'codigo' => 'MISSING_FIELDS'
            ]);
        }

        $pdo = getDBConnection();

        // 2. Buscar usuario en base de datos
        $stmt = $pdo->prepare('SELECT * FROM admins WHERE usuario = ? LIMIT 1');
        $stmt->execute([$usuario]);
        $admin = $stmt->fetch();

        $ip = getClientIP();

        // 3. Comprobación segura de contraseña
        // OWASP A07: Mensaje genérico para evitar enumeración de usuarios
        if (!$admin || !password_verify($password, $admin['password_hash'])) {
            // Incrementar contador de fallos del admin si existe
            if ($admin) {
                $upd = $pdo->prepare('UPDATE admins SET intentos_fallidos = intentos_fallidos + 1 WHERE id = ?');
                $upd->execute([$admin['id']]);
            }

            AuditLogger::log('login_fallido', 'auth', null, "Intento fallido para usuario: $usuario", null, $usuario);

            sendJsonResponse(401, [
                'error' => 'Usuario o contraseña no válidos.',
                'codigo' => 'INVALID_CREDENTIALS'
            ]);
        }

        // Si está inactivo
        if ((int)$admin['activo'] !== 1) {
            sendJsonResponse(403, [
                'error' => 'Esta cuenta de administrador se encuentra deshabilitada.',
                'codigo' => 'ACCOUNT_DISABLED'
            ]);
        }

        // 4. Éxito: Resetear tasa y actualizar registro en base de datos
        resetRateLimit('login');

        // Regenerar ID de sesión para prevenir Session Fixation (OWASP A07)
        session_regenerate_id(true);

        $_SESSION['admin_id'] = $admin['id'];
        $_SESSION['admin_usuario'] = $admin['usuario'];
        $_SESSION['admin_nombre'] = $admin['nombre'];
        $_SESSION['ip'] = $ip;
        $_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'] ?? '';

        $upd = $pdo->prepare('UPDATE admins SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_login = NOW(), ultimo_ip = ? WHERE id = ?');
        $upd->execute([$ip, $admin['id']]);

        AuditLogger::log('login', 'admin', $admin['id'], 'Inicio de sesión exitoso', $admin['id'], $admin['usuario']);

        return [
            'id' => $admin['id'],
            'usuario' => $admin['usuario'],
            'nombre' => $admin['nombre'],
            'correo' => $admin['correo'],
        ];
    }

    /**
     * Cerrar sesión de manera segura
     */
    public static function logout(): void
    {
        applySecurityHeaders();
        startSecureSession();

        if (!empty($_SESSION['admin_id'])) {
            AuditLogger::log('logout', 'admin', $_SESSION['admin_id'], 'Cierre de sesión', $_SESSION['admin_id'], $_SESSION['admin_usuario'] ?? 'admin');
        }

        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        session_destroy();
    }

    /**
     * Cambiar contraseña del administrador
     */
    public static function changePassword(string $adminId, string $actual, string $nueva): void
    {
        if (strlen($nueva) < 8) {
            sendJsonResponse(400, [
                'error' => 'La nueva contraseña debe tener al menos 8 caracteres.',
                'codigo' => 'WEAK_PASSWORD'
            ]);
        }

        $pdo = getDBConnection();
        $stmt = $pdo->prepare('SELECT password_hash, usuario FROM admins WHERE id = ? LIMIT 1');
        $stmt->execute([$adminId]);
        $admin = $stmt->fetch();

        if (!$admin || !password_verify($actual, $admin['password_hash'])) {
            sendJsonResponse(400, [
                'error' => 'La contraseña actual no es correcta.',
                'codigo' => 'CURRENT_PASSWORD_INCORRECT'
            ]);
        }

        // Hashear con costo 12 (OWASP A02)
        $nuevoHash = password_hash($nueva, PASSWORD_BCRYPT, ['cost' => 12]);

        $upd = $pdo->prepare('UPDATE admins SET password_hash = ?, actualizado_en = NOW() WHERE id = ?');
        $upd->execute([$nuevoHash, $adminId]);

        AuditLogger::log('cambio_password', 'admin', $adminId, 'Cambio de contraseña exitoso', $adminId, $admin['usuario']);
    }
}

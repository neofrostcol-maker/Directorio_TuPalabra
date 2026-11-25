<?php
declare(strict_types=1);

/**
 * =====================================================================
 * API ADMIN: CAMBIAR CONTRASEÑA DEL ADMINISTRADOR (POST)
 * OWASP A02 (Cryptographic Failures) & A07 (Autenticación)
 * =====================================================================
 */

require_once dirname(__DIR__, 2) . '/helpers/Auth.php';

applySecurityHeaders();

$admin = Auth::requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(405, ['error' => 'Método no permitido', 'codigo' => 'METHOD_NOT_ALLOWED']);
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true) ?: $_POST;

$actual = (string)($data['passwordActual'] ?? $data['password_actual'] ?? '');
$nueva = (string)($data['passwordNueva'] ?? $data['password_nueva'] ?? '');

if ($actual === '' || $nueva === '') {
    sendJsonResponse(400, [
        'error' => 'Debe ingresar la contraseña actual y la nueva contraseña.',
        'codigo' => 'FIELDS_REQUIRED'
    ]);
}

Auth::changePassword($admin['id'], $actual, $nueva);

sendJsonResponse(200, [
    'success' => true,
    'mensaje' => 'La contraseña de administrador ha sido actualizada exitosamente.',
]);

<?php
declare(strict_types=1);

/**
 * =====================================================================
 * API ADMIN: INICIO DE SESIÓN (POST)
 * OWASP A07 (Autenticación) & A04 (Rate Limiting)
 * =====================================================================
 */

require_once dirname(__DIR__, 2) . '/helpers/Auth.php';

applySecurityHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(405, ['error' => 'Método no permitido', 'codigo' => 'METHOD_NOT_ALLOWED']);
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true) ?: $_POST;

$usuario = (string)($data['usuario'] ?? '');
$password = (string)($data['password'] ?? '');

$admin = Auth::login($usuario, $password);

sendJsonResponse(200, [
    'success' => true,
    'mensaje' => 'Inicio de sesión exitoso.',
    'admin'   => $admin,
]);

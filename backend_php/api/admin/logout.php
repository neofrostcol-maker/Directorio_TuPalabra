<?php
declare(strict_types=1);

/**
 * =====================================================================
 * API ADMIN: CIERRE DE SESIÓN (POST)
 * =====================================================================
 */

require_once dirname(__DIR__, 2) . '/helpers/Auth.php';

applySecurityHeaders();

Auth::logout();

sendJsonResponse(200, [
    'success' => true,
    'mensaje' => 'Sesión cerrada correctamente.',
]);

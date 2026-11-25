<?php
declare(strict_types=1);

/**
 * =====================================================================
 * API ADMIN: ESTADO DE SESIÓN ACTUAL (GET)
 * =====================================================================
 */

require_once dirname(__DIR__, 2) . '/helpers/Auth.php';

applySecurityHeaders();

$admin = Auth::requireAdmin();

sendJsonResponse(200, [
    'authenticated' => true,
    'admin' => [
        'id'      => $admin['id'],
        'usuario' => $admin['usuario'],
        'correo'  => $admin['correo'],
        'nombre'  => $admin['nombre'],
    ],
]);

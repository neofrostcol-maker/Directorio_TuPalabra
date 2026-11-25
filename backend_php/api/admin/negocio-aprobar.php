<?php
declare(strict_types=1);

/**
 * =====================================================================
 * API ADMIN: APROBAR NEGOCIO INDIVIDUAL (POST)
 * =====================================================================
 */

require_once dirname(__DIR__, 2) . '/helpers/Auth.php';
require_once dirname(__DIR__, 2) . '/config/mailer.php';

applySecurityHeaders();

$admin = Auth::requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    sendJsonResponse(405, ['error' => 'Método no permitido', 'codigo' => 'METHOD_NOT_ALLOWED']);
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true) ?: $_POST;
$id = trim((string)($data['id'] ?? $_GET['id'] ?? ''));

if (!preg_match('/^[a-f0-9\-]{36}$/i', $id)) {
    sendJsonResponse(400, ['error' => 'ID de negocio no válido.', 'codigo' => 'INVALID_ID']);
}

try {
    $pdo = getDBConnection();

    // Obtener negocio
    $stmt = $pdo->prepare('SELECT id, nombre_negocio, correo, telefono FROM negocios WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $negocio = $stmt->fetch();

    if (!$negocio) {
        sendJsonResponse(404, ['error' => 'Negocio no encontrado.', 'codigo' => 'NOT_FOUND']);
    }

    // Actualizar estado a aprobado
    $upd = $pdo->prepare('
        UPDATE negocios 
        SET estado = "aprobado", motivo_rechazo = NULL, aprobado_en = NOW(), aprobado_por = ?, actualizado_en = NOW()
        WHERE id = ?
    ');
    $upd->execute([$admin['usuario'], $id]);

    // Notificar al solicitante por correo
    notifyUsuarioAprobado($negocio);

    // Registro de auditoría
    AuditLogger::log('aprobar', 'negocio', $id, "Negocio aprobado: {$negocio['nombre_negocio']}", $admin['id'], $admin['usuario']);

    sendJsonResponse(200, [
        'success' => true,
        'mensaje' => "El negocio \"{$negocio['nombre_negocio']}\" ha sido aprobado y publicado.",
    ]);
} catch (Exception $e) {
    error_log('Error en /api/admin/negocio-aprobar.php: ' . $e->getMessage());
    sendJsonResponse(500, ['error' => 'Error al aprobar el negocio.', 'codigo' => 'SERVER_ERROR']);
}

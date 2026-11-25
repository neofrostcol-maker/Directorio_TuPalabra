<?php
declare(strict_types=1);

/**
 * =====================================================================
 * API ADMIN: RECHAZAR NEGOCIO INDIVIDUAL (POST)
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
$motivo = cleanString((string)($data['motivo'] ?? $data['motivoRechazo'] ?? ''), 1000);

if (!preg_match('/^[a-f0-9\-]{36}$/i', $id)) {
    sendJsonResponse(400, ['error' => 'ID de negocio no válido.', 'codigo' => 'INVALID_ID']);
}

if (mb_strlen($motivo) < 5) {
    sendJsonResponse(400, [
        'error' => 'Debe ingresar un motivo claro del rechazo (mínimo 5 caracteres).',
        'codigo' => 'MOTIVO_REQUIRED'
    ]);
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

    // Actualizar estado a rechazado
    $upd = $pdo->prepare('
        UPDATE negocios 
        SET estado = "rechazado", motivo_rechazo = ?, actualizado_en = NOW()
        WHERE id = ?
    ');
    $upd->execute([$motivo, $id]);

    // Notificar al solicitante por correo con el motivo
    notifyUsuarioRechazado($negocio, $motivo);

    // Registro de auditoría
    AuditLogger::log('rechazar', 'negocio', $id, "Negocio rechazado ({$negocio['nombre_negocio']}). Motivo: $motivo", $admin['id'], $admin['usuario']);

    sendJsonResponse(200, [
        'success' => true,
        'mensaje' => "El negocio \"{$negocio['nombre_negocio']}\" ha sido marcado como rechazado y se notificó al solicitante.",
    ]);
} catch (Exception $e) {
    error_log('Error en /api/admin/negocio-rechazar.php: ' . $e->getMessage());
    sendJsonResponse(500, ['error' => 'Error al rechazar el negocio.', 'codigo' => 'SERVER_ERROR']);
}

<?php
declare(strict_types=1);

/**
 * =====================================================================
 * API ADMIN: ACCIONES MASIVAS SOBRE NEGOCIOS (POST)
 * =====================================================================
 */

require_once dirname(__DIR__, 2) . '/helpers/Auth.php';
require_once dirname(__DIR__, 2) . '/helpers/FileUploader.php';
require_once dirname(__DIR__, 2) . '/config/mailer.php';

applySecurityHeaders();

$admin = Auth::requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(405, ['error' => 'Método no permitido', 'codigo' => 'METHOD_NOT_ALLOWED']);
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true) ?: $_POST;

$accion = (string)($data['accion'] ?? '');
$ids = $data['ids'] ?? [];
$todosPendientes = !empty($data['todosPendientes'] ?? $data['todos_pendientes']);
$motivo = cleanString((string)($data['motivo'] ?? ''), 1000);

if (!in_array($accion, ['aprobar', 'rechazar', 'eliminar'], true)) {
    sendJsonResponse(400, [
        'error' => 'Acción masiva no válida. Debe ser "aprobar", "rechazar" o "eliminar".',
        'codigo' => 'INVALID_ACTION'
    ]);
}

if ($accion === 'rechazar' && mb_strlen($motivo) < 5) {
    sendJsonResponse(400, [
        'error' => 'Debe ingresar un motivo para el rechazo masivo (mínimo 5 caracteres).',
        'codigo' => 'MOTIVO_REQUIRED'
    ]);
}

try {
    $pdo = getDBConnection();

    // 1. Obtener lista de IDs afectados
    if ($todosPendientes) {
        $stmtIds = $pdo->query('SELECT id, nombre_negocio, correo, telefono FROM negocios WHERE estado = "pendiente"');
        $negociosAfectados = $stmtIds->fetchAll();
    } else {
        if (!is_array($ids) || empty($ids)) {
            sendJsonResponse(400, ['error' => 'Debe seleccionar al menos un registro.', 'codigo' => 'EMPTY_SELECTION']);
        }

        // Filtrar solo UUIDs válidos
        $validIds = array_filter($ids, fn($id) => is_string($id) && preg_match('/^[a-f0-9\-]{36}$/i', $id));
        if (empty($validIds)) {
            sendJsonResponse(400, ['error' => 'Ningún identificador seleccionado es válido.', 'codigo' => 'INVALID_IDS']);
        }

        $inClause = implode(',', array_fill(0, count($validIds), '?'));
        $stmtIds = $pdo->prepare("SELECT id, nombre_negocio, correo, telefono FROM negocios WHERE id IN ($inClause)");
        $stmtIds->execute(array_values($validIds));
        $negociosAfectados = $stmtIds->fetchAll();
    }

    if (empty($negociosAfectados)) {
        sendJsonResponse(200, ['success' => true, 'afectados' => 0, 'mensaje' => 'No se encontraron registros para procesar.']);
    }

    $afectados = 0;
    $fotosBorradasTotal = 0;

    // 2. Ejecutar la acción masiva
    switch ($accion) {
        case 'aprobar':
            $upd = $pdo->prepare('UPDATE negocios SET estado = "aprobado", motivo_rechazo = NULL, aprobado_en = NOW(), aprobado_por = ?, actualizado_en = NOW() WHERE id = ?');
            foreach ($negociosAfectados as $neg) {
                $upd->execute([$admin['usuario'], $neg['id']]);
                notifyUsuarioAprobado($neg);
                $afectados++;
            }
            break;

        case 'rechazar':
            $upd = $pdo->prepare('UPDATE negocios SET estado = "rechazado", motivo_rechazo = ?, actualizado_en = NOW() WHERE id = ?');
            foreach ($negociosAfectados as $neg) {
                $upd->execute([$motivo, $neg['id']]);
                notifyUsuarioRechazado($neg, $motivo);
                $afectados++;
            }
            break;

        case 'eliminar':
            $del = $pdo->prepare('DELETE FROM negocios WHERE id = ?');
            foreach ($negociosAfectados as $neg) {
                // Borrar archivos físicos del servidor cPanel
                $fotosBorradasTotal += FileUploader::deleteBusinessImages($neg['id'], $pdo);
                $del->execute([$neg['id']]);
                $afectados++;
            }
            break;
    }

    // 3. Auditoría
    AuditLogger::log(
        "masivo_$accion",
        'negocios',
        null,
        "Acción masiva '$accion' sobre $afectados negocios" . ($accion === 'eliminar' ? " ($fotosBorradasTotal fotos borradas del servidor)" : ''),
        $admin['id'],
        $admin['usuario']
    );

    sendJsonResponse(200, [
        'success'            => true,
        'accion'             => $accion,
        'afectados'          => $afectados,
        'fotosBorradasTotal' => $fotosBorradasTotal,
        'mensaje'            => "Acción masiva completada exitosamente sobre $afectados negocios.",
    ]);
} catch (Exception $e) {
    error_log('Error en /api/admin/negocios-masivo.php: ' . $e->getMessage());
    sendJsonResponse(500, ['error' => 'Error al procesar la acción masiva.', 'codigo' => 'SERVER_ERROR']);
}

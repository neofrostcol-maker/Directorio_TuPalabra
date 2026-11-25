<?php
declare(strict_types=1);

/**
 * =====================================================================
 * API ADMIN: ELIMINAR NEGOCIO INDIVIDUAL Y SUS IMÁGENES FÍSICAS (POST/DELETE)
 * =====================================================================
 */

require_once dirname(__DIR__, 2) . '/helpers/Auth.php';
require_once dirname(__DIR__, 2) . '/helpers/FileUploader.php';

applySecurityHeaders();

$admin = Auth::requireAdmin();

$method = $_SERVER['REQUEST_METHOD'] ?? 'POST';
if ($method !== 'POST' && $method !== 'DELETE') {
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
    $stmt = $pdo->prepare('SELECT id, nombre_negocio FROM negocios WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $negocio = $stmt->fetch();

    if (!$negocio) {
        sendJsonResponse(404, ['error' => 'El negocio no existe.', 'codigo' => 'NOT_FOUND']);
    }

    // 1. Borrar imágenes físicas del disco en cPanel (OWASP: evitar archivos huérfanos)
    $fotosBorradas = FileUploader::deleteBusinessImages($id, $pdo);

    // 2. Eliminar registro de la base de datos (Las claves foráneas CASCADE eliminan categorías e imágenes)
    $del = $pdo->prepare('DELETE FROM negocios WHERE id = ?');
    $del->execute([$id]);

    // 3. Auditoría
    AuditLogger::log(
        'eliminar',
        'negocio',
        $id,
        "Negocio eliminado permanentemente: {$negocio['nombre_negocio']} ($fotosBorradas imágenes borradas del servidor)",
        $admin['id'],
        $admin['usuario']
    );

    sendJsonResponse(200, [
        'success' => true,
        'mensaje' => "El negocio \"{$negocio['nombre_negocio']}\" y sus archivos asociados han sido eliminados.",
        'fotosBorradas' => $fotosBorradas,
    ]);
} catch (Exception $e) {
    error_log('Error en /api/admin/negocio-eliminar.php: ' . $e->getMessage());
    sendJsonResponse(500, ['error' => 'Error al eliminar el negocio.', 'codigo' => 'SERVER_ERROR']);
}

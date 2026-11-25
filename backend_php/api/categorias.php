<?php
declare(strict_types=1);

/**
 * =====================================================================
 * API ENDPOINT: CATEGORÍAS OFICIALES (GET)
 * =====================================================================
 */

require_once dirname(__DIR__) . '/config/database.php';
require_once dirname(__DIR__) . '/config/security.php';

applySecurityHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(405, ['error' => 'Método no permitido', 'codigo' => 'METHOD_NOT_ALLOWED']);
}

try {
    $pdo = getDBConnection();
    $stmt = $pdo->query('
        SELECT id, nombre, slug, descripcion, icono 
        FROM categorias 
        WHERE activo = 1 
        ORDER BY nombre ASC
    ');
    $categorias = $stmt->fetchAll();

    // Cache público en cabecera HTTP (1 hora)
    header('Cache-Control: public, max-age=3600');
    sendJsonResponse(200, $categorias);
} catch (Exception $e) {
    error_log('Error en /api/categorias.php: ' . $e->getMessage());
    sendJsonResponse(500, ['error' => 'Error al obtener las categorías.', 'codigo' => 'SERVER_ERROR']);
}

<?php
declare(strict_types=1);

/**
 * =====================================================================
 * API ENDPOINT: DETALLE DE NEGOCIO POR ID (GET)
 * =====================================================================
 */

require_once dirname(__DIR__) . '/config/database.php';
require_once dirname(__DIR__) . '/config/security.php';

applySecurityHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(405, ['error' => 'Método no permitido', 'codigo' => 'METHOD_NOT_ALLOWED']);
}

$id = trim($_GET['id'] ?? '');

// Validación de formato UUID v4
if (!preg_match('/^[a-f0-9\-]{36}$/i', $id)) {
    sendJsonResponse(400, ['error' => 'Identificador de negocio inválido.', 'codigo' => 'INVALID_ID']);
}

try {
    $pdo = getDBConnection();

    // Consulta con prepared statement (omitiendo documento privado)
    $stmt = $pdo->prepare('
        SELECT 
            id, tipo, nombre_negocio, direccion, telefono, correo,
            descripcion_corta, descripcion_larga, responsable,
            ciudad, barrio, sitio_web, instagram, facebook, tiktok, catalogo_url,
            horario, anio_fundacion, tipos_atencion, servicios_destacados,
            promocion_miembros, es_miembro_iglesia, logo_url, estado, creado_en
        FROM negocios
        WHERE id = ? AND estado = "aprobado"
        LIMIT 1
    ');
    $stmt->execute([$id]);
    $negocio = $stmt->fetch();

    if (!$negocio) {
        sendJsonResponse(404, ['error' => 'El negocio no existe o no ha sido aprobado.', 'codigo' => 'NOT_FOUND']);
    }

    // Obtener imágenes ordenadas
    $stmtImgs = $pdo->prepare('
        SELECT id, url, orden 
        FROM negocio_imagenes 
        WHERE negocio_id = ? 
        ORDER BY orden ASC
    ');
    $stmtImgs->execute([$id]);
    $imagenes = $stmtImgs->fetchAll();

    // Obtener categorías relacionadas
    $stmtCats = $pdo->prepare('
        SELECT c.id, c.nombre, c.slug, c.descripcion 
        FROM negocio_categorias nc
        JOIN categorias c ON nc.categoria_id = c.id
        WHERE nc.negocio_id = ?
        ORDER BY c.nombre ASC
    ');
    $stmtCats->execute([$id]);
    $categorias = $stmtCats->fetchAll();

    sendJsonResponse(200, [
        'id'                  => $negocio['id'],
        'tipo'                => $negocio['tipo'],
        'nombreNegocio'       => $negocio['nombre_negocio'],
        'direccion'           => $negocio['direccion'],
        'telefono'            => $negocio['telefono'],
        'correo'              => $negocio['correo'],
        'descripcionCorta'    => $negocio['descripcion_corta'],
        'descripcionLarga'    => $negocio['descripcion_larga'],
        'responsable'         => $negocio['responsable'],
        'ciudad'              => $negocio['ciudad'],
        'barrio'              => $negocio['barrio'],
        'sitioWeb'            => $negocio['sitio_web'],
        'instagram'           => $negocio['instagram'],
        'facebook'            => $negocio['facebook'],
        'tiktok'              => $negocio['tiktok'],
        'catalogoUrl'         => $negocio['catalogo_url'],
        'horario'             => $negocio['horario'],
        'anioFundacion'       => $negocio['anio_fundacion'],
        'tiposAtencion'       => json_decode($negocio['tipos_atencion'] ?? '[]', true) ?: [],
        'serviciosDestacados' => json_decode($negocio['servicios_destacados'] ?? '[]', true) ?: [],
        'promocionMiembros'   => $negocio['promocion_miembros'],
        'esMiembroIglesia'    => (bool)$negocio['es_miembro_iglesia'],
        'logoUrl'             => $negocio['logo_url'],
        'creadoEn'            => $negocio['creado_en'],
        'imagenes'            => $imagenes,
        'categorias'          => $categorias,
    ]);
} catch (Exception $e) {
    error_log('Error en /api/negocio.php: ' . $e->getMessage());
    sendJsonResponse(500, ['error' => 'Error al consultar el detalle del negocio.', 'codigo' => 'SERVER_ERROR']);
}

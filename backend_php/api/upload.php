<?php
declare(strict_types=1);

/**
 * =====================================================================
 * API ENDPOINT: SUBIDA DE IMÁGENES AL SERVIDOR (POST)
 * OWASP A08 (Integridad) & A05 (Misconfiguration)
 * =====================================================================
 */

require_once dirname(__DIR__) . '/config/database.php';
require_once dirname(__DIR__) . '/config/security.php';
require_once dirname(__DIR__) . '/helpers/FileUploader.php';

applySecurityHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(405, ['error' => 'Método no permitido', 'codigo' => 'METHOD_NOT_ALLOWED']);
}

// 1. Rate limiting contra abuso de subida de archivos (OWASP A04: Máximo 30 subidas por IP en 1 hora)
if (!checkRateLimit('upload', 30, 3600)) {
    sendJsonResponse(429, [
        'error' => 'Ha excedido el límite temporal de subida de imágenes. Espere unos minutos.',
        'codigo' => 'UPLOAD_RATE_LIMIT'
    ]);
}

// 2. Verificar que exista archivo en la petición
if (empty($_FILES['file'])) {
    sendJsonResponse(400, ['error' => 'No se recibió ningún archivo.', 'codigo' => 'NO_FILE_SENT']);
}

// Tipo de subida: 'logos' o 'negocios' (por defecto 'negocios')
$tipo = ($_POST['tipo'] ?? '') === 'logo' ? 'logos' : 'negocios';

try {
    $resultado = FileUploader::uploadImage($_FILES['file'], $tipo);

    sendJsonResponse(200, [
        'url'            => $resultado['url'],
        'url_completa'   => $resultado['url_completa'],
        'nombre_archivo' => $resultado['nombre_archivo'],
        'peso'           => $resultado['peso'],
        'mime'           => $resultado['mime'],
    ]);
} catch (Exception $e) {
    error_log('Error en /api/upload.php: ' . $e->getMessage());
    sendJsonResponse(500, ['error' => 'Error al procesar la imagen.', 'codigo' => 'UPLOAD_FAILED']);
}

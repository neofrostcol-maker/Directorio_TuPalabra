<?php
declare(strict_types=1);

/**
 * =====================================================================
 * GESTOR DE SUBIDA SEGURA DE IMÁGENES AL SERVIDOR (cPanel / Local Disk)
 * OWASP A08 (Software & Data Integrity) & A05 (Security Misconfiguration)
 * =====================================================================
 */

require_once dirname(__DIR__) . '/config/database.php';
require_once dirname(__DIR__) . '/config/security.php';

class FileUploader
{
    // Extensiones permitidas (Lista blanca estricta)
    private const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

    // Tipos MIME reales permitidos (comprobados mediante magic bytes)
    private const ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/pjpeg',
        'image/png',
        'image/webp'
    ];

    // Tamaño máximo: 5 MB
    private const MAX_FILE_SIZE = 5 * 1024 * 1024;

    /**
     * Procesar y guardar de manera segura una imagen subida
     *
     * @param array $file Arreglo $_FILES['file']
     * @param string $subcarpeta 'negocios' o 'logos'
     * @return array [url, nombre_archivo, ruta_disco, peso, mime]
     */
    public static function uploadImage(array $file, string $subcarpeta = 'negocios'): array
    {
        // 1. Validar código de error de PHP
        if (!isset($file['error']) || is_array($file['error'])) {
            sendJsonResponse(400, ['error' => 'Parámetros de subida inválidos.', 'codigo' => 'UPLOAD_INVALID']);
        }

        switch ($file['error']) {
            case UPLOAD_ERR_OK:
                break;
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                sendJsonResponse(400, ['error' => 'La imagen excede el límite permitido por el servidor.', 'codigo' => 'FILE_TOO_LARGE']);
            case UPLOAD_ERR_NO_FILE:
                sendJsonResponse(400, ['error' => 'No se seleccionó ningún archivo.', 'codigo' => 'NO_FILE']);
            default:
                sendJsonResponse(500, ['error' => 'Error del servidor al recibir el archivo.', 'codigo' => 'UPLOAD_ERROR']);
        }

        // 2. Validar tamaño en bytes
        if ($file['size'] > self::MAX_FILE_SIZE) {
            sendJsonResponse(400, ['error' => 'El archivo supera el tamaño máximo permitido de 5 MB.', 'codigo' => 'FILE_TOO_LARGE']);
        }

        // 3. Validar extensión en lista blanca
        $originalName = (string)($file['name'] ?? '');
        $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

        if (!in_array($extension, self::ALLOWED_EXTENSIONS, true)) {
            sendJsonResponse(400, [
                'error' => 'Formato no permitido. Solo se aceptan imágenes JPG, PNG o WebP.',
                'codigo' => 'INVALID_EXTENSION'
            ]);
        }

        // 4. Validar tipo MIME real mediante finfo (Magic Bytes) - No confiar en $_FILES['type']
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $realMime = $finfo->file($file['tmp_name']);

        if (!$realMime || !in_array($realMime, self::ALLOWED_MIME_TYPES, true)) {
            sendJsonResponse(400, [
                'error' => 'El contenido del archivo no corresponde a una imagen válida.',
                'codigo' => 'INVALID_MIME_TYPE'
            ]);
        }

        // 5. Validar integridad de imagen mediante getimagesize (previene polyglots / scripts PHP camuflados)
        $imageInfo = @getimagesize($file['tmp_name']);
        if ($imageInfo === false || $imageInfo[0] === 0 || $imageInfo[1] === 0) {
            sendJsonResponse(400, [
                'error' => 'El archivo está corrupto o no es una imagen gráfica auténtica.',
                'codigo' => 'CORRUPT_IMAGE'
            ]);
        }

        // 6. Preparar directorio de destino en cPanel
        $targetDir = UPLOADS_DIR . '/' . trim($subcarpeta, '/');
        if (!is_dir($targetDir)) {
            if (!mkdir($targetDir, 0755, true) && !is_dir($targetDir)) {
                sendJsonResponse(500, ['error' => 'No fue posible crear la carpeta de almacenamiento.', 'codigo' => 'DIR_CREATE_FAILED']);
            }
        }

        // 7. Generar nombre de archivo aleatorio e impredecible (UUIDv4) - OWASP A08
        $safeExtension = ($extension === 'jpeg') ? 'jpg' : $extension;
        $nombreArchivo = generateUUIDv4() . '.' . $safeExtension;
        $rutaDisco = $targetDir . '/' . $nombreArchivo;

        // 8. Mover el archivo a su ubicación permanente
        if (!move_uploaded_file($file['tmp_name'], $rutaDisco)) {
            sendJsonResponse(500, ['error' => 'Error al guardar la imagen en el servidor.', 'codigo' => 'SAVE_FAILED']);
        }

        // Establecer permisos seguros de archivo (Lectura pública, no ejecución)
        @chmod($rutaDisco, 0644);

        // URL pública relativa accesible vía web
        $urlPublica = '/uploads/' . $subcarpeta . '/' . $nombreArchivo;

        return [
            'url'            => $urlPublica,
            'url_completa'   => rtrim(APP_URL, '/') . $urlPublica,
            'nombre_archivo' => $nombreArchivo,
            'ruta_disco'     => $rutaDisco,
            'peso'           => (int)$file['size'],
            'mime'           => $realMime,
        ];
    }

    /**
     * Eliminar archivo del disco de manera segura (previene Path Traversal)
     *
     * @param string|null $url O ruta relativa de la imagen
     * @return bool
     */
    public static function deleteLocalFile(?string $url): bool
    {
        if (empty($url)) return false;

        // Si es una URL externa o base64, no intentar borrar del disco
        if (str_starts_with($url, 'http://') || str_starts_with($url, 'https://')) {
            $parsedPath = parse_url($url, PHP_URL_PATH);
            if ($parsedPath) {
                $url = $parsedPath;
            } else {
                return false;
            }
        }

        // Sanitizar ruta eliminando '../' para prevenir Path Traversal
        $urlLimpia = str_replace(['..', '\\'], '', $url);
        $urlLimpia = ltrim($urlLimpia, '/');

        // Ruta absoluta esperada
        $baseDir = realpath(dirname(__DIR__));
        $rutaCompleta = $baseDir . '/' . $urlLimpia;

        // Verificar que la ruta resuelta permanezca dentro de UPLOADS_DIR
        $realUploads = realpath(UPLOADS_DIR);
        $realFile = realpath($rutaCompleta);

        if ($realFile && $realUploads && str_starts_with($realFile, $realUploads) && is_file($realFile)) {
            return @unlink($realFile);
        }

        return false;
    }

    /**
     * Eliminar todas las imágenes de un negocio (fotos de galería y logo) al ser eliminado
     */
    public static function deleteBusinessImages(string $negocioId, PDO $pdo): int
    {
        $eliminadas = 0;

        try {
            // 1. Obtener y borrar fotos de la galería
            $stmt = $pdo->prepare('SELECT url, ruta_disco FROM negocio_imagenes WHERE negocio_id = ?');
            $stmt->execute([$negocioId]);
            $imagenes = $stmt->fetchAll();

            foreach ($imagenes as $img) {
                if (!empty($img['ruta_disco']) && is_file($img['ruta_disco'])) {
                    if (@unlink($img['ruta_disco'])) $eliminadas++;
                } else {
                    if (self::deleteLocalFile($img['url'])) $eliminadas++;
                }
            }

            // 2. Obtener y borrar el logo si es local
            $stmtLogo = $pdo->prepare('SELECT logo_url FROM negocios WHERE id = ? LIMIT 1');
            $stmtLogo->execute([$negocioId]);
            $logo = $stmtLogo->fetchColumn();

            if ($logo) {
                self::deleteLocalFile((string)$logo);
            }
        } catch (Exception $e) {
            error_log("Error eliminando imágenes para negocio $negocioId: " . $e->getMessage());
        }

        return $eliminadas;
    }
}

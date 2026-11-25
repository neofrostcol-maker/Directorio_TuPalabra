<?php
declare(strict_types=1);

/**
 * =====================================================================
 * API ENDPOINT: NEGOCIOS PÚBLICOS (GET / POST)
 * OWASP A03 (Injection - PDO Prepared Statements) & A04 (Honeypot)
 * =====================================================================
 */

require_once dirname(__DIR__) . '/config/database.php';
require_once dirname(__DIR__) . '/config/security.php';
require_once dirname(__DIR__) . '/config/mailer.php';
require_once dirname(__DIR__) . '/helpers/Validator.php';
require_once dirname(__DIR__) . '/helpers/AuditLogger.php';

applySecurityHeaders();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// =====================================================================
// GET: Explorar y filtrar negocios aprobados públicamente
// =====================================================================
if ($method === 'GET') {
    try {
        $pdo = getDBConnection();

        $busqueda = trim($_GET['q'] ?? '');
        $categoriaSlug = trim($_GET['categoria'] ?? '');
        $tipo = trim($_GET['tipo'] ?? '');
        $ciudad = trim($_GET['ciudad'] ?? '');
        $soloMiembros = ($_GET['miembro'] ?? '') === 'true';
        $orden = ($_GET['orden'] ?? '') === 'az' ? 'az' : 'recientes';
        $pagina = max(1, (int)($_GET['pagina'] ?? 1));
        $limite = min(50, max(1, (int)($_GET['limite'] ?? 12)));
        $offset = ($pagina - 1) * $limite;

        $where = ['n.estado = "aprobado"'];
        $params = [];

        // Filtro por búsqueda de texto
        if ($busqueda !== '') {
            $where[] = '(n.nombre_negocio LIKE ? OR n.descripcion_corta LIKE ? OR n.descripcion_larga LIKE ? OR n.ciudad LIKE ?)';
            $like = '%' . $busqueda . '%';
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
        }

        // Filtro por categoría
        if ($categoriaSlug !== '') {
            $where[] = 'EXISTS (
                SELECT 1 FROM negocio_categorias nc 
                JOIN categorias c ON nc.categoria_id = c.id 
                WHERE nc.negocio_id = n.id AND c.slug = ?
            )';
            $params[] = $categoriaSlug;
        }

        // Filtro por tipo
        if (in_array($tipo, ['empresa', 'persona_natural'], true)) {
            $where[] = 'n.tipo = ?';
            $params[] = $tipo;
        }

        // Filtro por ciudad
        if ($ciudad !== '') {
            $where[] = 'n.ciudad = ?';
            $params[] = $ciudad;
        }

        // Filtro solo miembros
        if ($soloMiembros) {
            $where[] = 'n.es_miembro_iglesia = 1';
        }

        $whereClause = implode(' AND ', $where);

        // 1. Contar total de registros coincidentes
        $countSql = "SELECT COUNT(*) FROM negocios n WHERE $whereClause";
        $stmtCount = $pdo->prepare($countSql);
        $stmtCount->execute($params);
        $total = (int)$stmtCount->fetchColumn();

        // 2. Ordenamiento
        $orderClause = ($orden === 'az') 
            ? 'ORDER BY n.nombre_negocio ASC' 
            : 'ORDER BY n.creado_en DESC';

        // 3. Consulta paginada (OWASP A03: Campos sensibles como "documento" se omiten expresamente)
        $sql = "
            SELECT 
                n.id, n.tipo, n.nombre_negocio, n.direccion, n.telefono, n.correo,
                n.descripcion_corta, n.ciudad, n.barrio, n.horario, n.tipos_atencion,
                n.servicios_destacados, n.promocion_miembros, n.es_miembro_iglesia,
                n.logo_url, n.creado_en
            FROM negocios n
            WHERE $whereClause
            $orderClause
            LIMIT $limite OFFSET $offset
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        // 4. Adjuntar imágenes y categorías a cada negocio
        $negociosIds = array_column($rows, 'id');
        $imagenesPorNegocio = [];
        $categoriasPorNegocio = [];

        if (!empty($negociosIds)) {
            // Placeholder de IDs para prepared statement
            $inClause = implode(',', array_fill(0, count($negociosIds), '?'));

            // Obtener imágenes
            $stmtImgs = $pdo->prepare("
                SELECT id, negocio_id, url, orden 
                FROM negocio_imagenes 
                WHERE negocio_id IN ($inClause) 
                ORDER BY orden ASC
            ");
            $stmtImgs->execute($negociosIds);
            while ($img = $stmtImgs->fetch()) {
                $imagenesPorNegocio[$img['negocio_id']][] = [
                    'id'    => $img['id'],
                    'url'   => $img['url'],
                    'orden' => (int)$img['orden'],
                ];
            }

            // Obtener categorías
            $stmtCats = $pdo->prepare("
                SELECT nc.negocio_id, c.id, c.nombre, c.slug 
                FROM negocio_categorias nc
                JOIN categorias c ON nc.categoria_id = c.id
                WHERE nc.negocio_id IN ($inClause)
                ORDER BY c.nombre ASC
            ");
            $stmtCats->execute($negociosIds);
            while ($cat = $stmtCats->fetch()) {
                $categoriasPorNegocio[$cat['negocio_id']][] = [
                    'id'     => (int)$cat['id'],
                    'nombre' => $cat['nombre'],
                    'slug'   => $cat['slug'],
                ];
            }
        }

        // Formatear resultados compatibles con el frontend
        $negocios = array_map(function ($row) use ($imagenesPorNegocio, $categoriasPorNegocio) {
            $id = $row['id'];
            return [
                'id'                  => $id,
                'tipo'                => $row['tipo'],
                'nombreNegocio'       => $row['nombre_negocio'],
                'direccion'           => $row['direccion'],
                'telefono'            => $row['telefono'],
                'correo'              => $row['correo'],
                'descripcionCorta'    => $row['descripcion_corta'],
                'ciudad'              => $row['ciudad'],
                'barrio'              => $row['barrio'],
                'horario'             => $row['horario'],
                'tiposAtencion'       => json_decode($row['tipos_atencion'] ?? '[]', true) ?: [],
                'serviciosDestacados' => json_decode($row['servicios_destacados'] ?? '[]', true) ?: [],
                'promocionMiembros'   => $row['promocion_miembros'],
                'esMiembroIglesia'    => (bool)$row['es_miembro_iglesia'],
                'logoUrl'             => $row['logo_url'],
                'creadoEn'            => $row['creado_en'],
                'imagenes'            => $imagenesPorNegocio[$id] ?? [],
                'categorias'          => $categoriasPorNegocio[$id] ?? [],
            ];
        }, $rows);

        sendJsonResponse(200, [
            'negocios'     => $negocios,
            'total'        => $total,
            'pagina'       => $pagina,
            'limite'       => $limite,
            'totalPaginas' => (int)ceil($total / $limite),
        ]);
    } catch (Exception $e) {
        error_log('Error en GET /api/negocios.php: ' . $e->getMessage());
        sendJsonResponse(500, ['error' => 'Error al consultar los negocios.', 'codigo' => 'SERVER_ERROR']);
    }
}

// =====================================================================
// POST: Envío de nuevo registro de negocio (Formulario público)
// =====================================================================
if ($method === 'POST') {
    // 1. Rate limiting contra flooding (OWASP A04: Máx 10 registros por IP en 1 hora)
    if (!checkRateLimit('registro', 10, 3600)) {
        sendJsonResponse(429, [
            'error' => 'Ha superado el límite de registros permitidos temporalmente.',
            'codigo' => 'RATE_LIMIT_EXCEEDED'
        ]);
    }

    // Leer payload JSON o FormData
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (str_contains($contentType, 'application/json')) {
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true) ?: [];
    } else {
        $input = $_POST;
    }

    // 2. Validar datos estrictamente
    $validated = Validator::validateNegocio($input, false);

    $pdo = getDBConnection();
    $negocioId = generateUUIDv4();
    $ip = getClientIP();
    $ua = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255);

    try {
        $pdo->beginTransaction();

        // 3. Insertar negocio principal
        $stmt = $pdo->prepare('
            INSERT INTO negocios (
                id, tipo, nombre_negocio, direccion, telefono, correo,
                descripcion_corta, descripcion_larga, responsable, documento,
                ciudad, barrio, sitio_web, instagram, facebook, tiktok, catalogo_url,
                horario, anio_fundacion, tipos_atencion, servicios_destacados,
                promocion_miembros, es_miembro_iglesia, logo_url, estado,
                acepta_datos, fecha_aceptacion_datos, ip_registro, user_agent, creado_en
            ) VALUES (
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, "pendiente",
                1, NOW(), ?, ?, NOW()
            )
        ');

        $stmt->execute([
            $negocioId,
            $validated['tipo'],
            $validated['nombre_negocio'],
            $validated['direccion'],
            $validated['telefono'],
            $validated['correo'],
            $validated['descripcion_corta'],
            $validated['descripcion_larga'],
            $validated['responsable'],
            $validated['documento'],
            $validated['ciudad'],
            $validated['barrio'],
            $validated['sitio_web'],
            $validated['instagram'],
            $validated['facebook'],
            $validated['tiktok'],
            $validated['catalogo_url'],
            $validated['horario'],
            $validated['anio_fundacion'],
            $validated['tipos_atencion'],
            $validated['servicios_destacados'],
            $validated['promocion_miembros'],
            $validated['es_miembro_iglesia'],
            $validated['logo_url'],
            $ip,
            $ua,
        ]);

        // 4. Relacionar categorías (1 a 5)
        $stmtRel = $pdo->prepare('INSERT INTO negocio_categorias (negocio_id, categoria_id) VALUES (?, ?)');
        foreach ($validated['categorias_ids'] as $catId) {
            $stmtRel->execute([$negocioId, $catId]);
        }

        // 5. Insertar imágenes de la galería
        $stmtImg = $pdo->prepare('
            INSERT INTO negocio_imagenes (id, negocio_id, url, nombre_archivo, ruta_disco, orden, creado_en)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ');

        foreach ($validated['imagenes'] as $idx => $img) {
            $imgUrl = is_array($img) ? ($img['url'] ?? '') : (string)$img;
            if ($imgUrl === '') continue;

            $imgId = generateUUIDv4();
            $nombreArchivo = basename($imgUrl);
            $rutaDisco = UPLOADS_DIR . '/negocios/' . $nombreArchivo;

            $stmtImg->execute([
                $imgId,
                $negocioId,
                $imgUrl,
                $nombreArchivo,
                $rutaDisco,
                $idx,
            ]);
        }

        $pdo->commit();

        // 6. Notificar al administrador por correo
        notifyAdminNuevoNegocio([
            'id'                 => $negocioId,
            'nombre_negocio'     => $validated['nombre_negocio'],
            'tipo'               => $validated['tipo'],
            'telefono'           => $validated['telefono'],
            'correo'             => $validated['correo'],
            'ciudad'             => $validated['ciudad'],
            'barrio'             => $validated['barrio'],
            'es_miembro_iglesia' => $validated['es_miembro_iglesia'],
        ]);

        AuditLogger::log('registro', 'negocio', $negocioId, "Nuevo registro creado para {$validated['nombre_negocio']}");

        sendJsonResponse(201, [
            'success' => true,
            'id'      => $negocioId,
            'message' => '¡Tu registro ha sido enviado exitosamente! Será revisado por la administración para su publicación.',
        ]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log('Error en POST /api/negocios.php: ' . $e->getMessage());
        sendJsonResponse(500, [
            'error' => 'Ocurrió un error al procesar el registro en la base de datos.',
            'codigo' => 'DB_INSERT_FAILED'
        ]);
    }
}

sendJsonResponse(405, ['error' => 'Método no permitido', 'codigo' => 'METHOD_NOT_ALLOWED']);

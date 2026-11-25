<?php
declare(strict_types=1);

/**
 * =====================================================================
 * API ADMIN: GESTIÓN DE NEGOCIOS (GET)
 * =====================================================================
 */

require_once dirname(__DIR__, 2) . '/helpers/Auth.php';

applySecurityHeaders();

$admin = Auth::requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(405, ['error' => 'Método no permitido', 'codigo' => 'METHOD_NOT_ALLOWED']);
}

try {
    $pdo = getDBConnection();

    $estado = trim($_GET['estado'] ?? '');
    $categoriaId = (int)($_GET['categoriaId'] ?? 0);
    $tipo = trim($_GET['tipo'] ?? '');
    $busqueda = trim($_GET['q'] ?? '');
    $fechaDesde = trim($_GET['fechaDesde'] ?? '');
    $fechaHasta = trim($_GET['fechaHasta'] ?? '');
    $pagina = max(1, (int)($_GET['pagina'] ?? 1));
    $limite = min(100, max(1, (int)($_GET['limite'] ?? 15)));
    $offset = ($pagina - 1) * $limite;

    $where = ['1=1'];
    $params = [];

    if ($estado !== '' && in_array($estado, ['pendiente', 'aprobado', 'rechazado'], true)) {
        $where[] = 'n.estado = ?';
        $params[] = $estado;
    }

    if ($tipo !== '' && in_array($tipo, ['empresa', 'persona_natural'], true)) {
        $where[] = 'n.tipo = ?';
        $params[] = $tipo;
    }

    if ($categoriaId > 0) {
        $where[] = 'EXISTS (SELECT 1 FROM negocio_categorias nc WHERE nc.negocio_id = n.id AND nc.categoria_id = ?)';
        $params[] = $categoriaId;
    }

    if ($busqueda !== '') {
        $where[] = '(n.nombre_negocio LIKE ? OR n.correo LIKE ? OR n.telefono LIKE ? OR n.responsable LIKE ? OR n.documento LIKE ?)';
        $like = '%' . $busqueda . '%';
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
    }

    if ($fechaDesde !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaDesde)) {
        $where[] = 'n.creado_en >= ?';
        $params[] = $fechaDesde . ' 00:00:00';
    }

    if ($fechaHasta !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaHasta)) {
        $where[] = 'n.creado_en <= ?';
        $params[] = $fechaHasta . ' 23:59:59';
    }

    $whereSql = implode(' AND ', $where);

    // Contar total
    $stmtCount = $pdo->prepare("SELECT COUNT(*) FROM negocios n WHERE $whereSql");
    $stmtCount->execute($params);
    $total = (int)$stmtCount->fetchColumn();

    // Contar pendientes totales para la alerta del dashboard
    $totalPendientes = (int)$pdo->query('SELECT COUNT(*) FROM negocios WHERE estado = "pendiente"')->fetchColumn();

    // Consulta paginada (incluye documento para revisión interna del admin)
    $stmt = $pdo->prepare("
        SELECT 
            n.id, n.tipo, n.nombre_negocio, n.direccion, n.telefono, n.correo,
            n.descripcion_corta, n.descripcion_larga, n.responsable, n.documento,
            n.ciudad, n.barrio, n.sitio_web, n.instagram, n.facebook, n.tiktok,
            n.catalogo_url, n.horario, n.anio_fundacion, n.tipos_atencion,
            n.servicios_destacados, n.promocion_miembros, n.es_miembro_iglesia,
            n.logo_url, n.estado, n.motivo_rechazo, n.acepta_datos,
            n.fecha_aceptacion_datos, n.creado_en, n.aprobado_en, n.aprobado_por
        FROM negocios n
        WHERE $whereSql
        ORDER BY n.creado_en DESC
        LIMIT $limite OFFSET $offset
    ");
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    // Cargar fotos y categorías
    $negociosIds = array_column($rows, 'id');
    $imagenes = [];
    $categorias = [];

    if (!empty($negociosIds)) {
        $inClause = implode(',', array_fill(0, count($negociosIds), '?'));

        $stmtImgs = $pdo->prepare("SELECT id, negocio_id, url, orden FROM negocio_imagenes WHERE negocio_id IN ($inClause) ORDER BY orden ASC");
        $stmtImgs->execute($negociosIds);
        while ($img = $stmtImgs->fetch()) {
            $imagenes[$img['negocio_id']][] = $img;
        }

        $stmtCats = $pdo->prepare("
            SELECT nc.negocio_id, c.id, c.nombre, c.slug 
            FROM negocio_categorias nc 
            JOIN categorias c ON nc.categoria_id = c.id 
            WHERE nc.negocio_id IN ($inClause)
            ORDER BY c.nombre ASC
        ");
        $stmtCats->execute($negociosIds);
        while ($cat = $stmtCats->fetch()) {
            $categorias[$cat['negocio_id']][] = $cat;
        }
    }

    $negocios = array_map(function ($row) use ($imagenes, $categorias) {
        $id = $row['id'];
        return [
            'id'                  => $id,
            'tipo'                => $row['tipo'],
            'nombreNegocio'       => $row['nombre_negocio'],
            'direccion'           => $row['direccion'],
            'telefono'            => $row['telefono'],
            'correo'              => $row['correo'],
            'descripcionCorta'    => $row['descripcion_corta'],
            'descripcionLarga'    => $row['descripcion_larga'],
            'responsable'         => $row['responsable'],
            'documento'           => $row['documento'],
            'ciudad'              => $row['ciudad'],
            'barrio'              => $row['barrio'],
            'sitioWeb'            => $row['sitio_web'],
            'instagram'           => $row['instagram'],
            'facebook'            => $row['facebook'],
            'tiktok'              => $row['tiktok'],
            'catalogoUrl'         => $row['catalogo_url'],
            'horario'             => $row['horario'],
            'anioFundacion'       => $row['anio_fundacion'],
            'tiposAtencion'       => json_decode($row['tipos_atencion'] ?? '[]', true) ?: [],
            'serviciosDestacados' => json_decode($row['servicios_destacados'] ?? '[]', true) ?: [],
            'promocionMiembros'   => $row['promocion_miembros'],
            'esMiembroIglesia'    => (bool)$row['es_miembro_iglesia'],
            'logoUrl'             => $row['logo_url'],
            'estado'              => $row['estado'],
            'motivoRechazo'       => $row['motivo_rechazo'],
            'creadoEn'            => $row['creado_en'],
            'aprobadoEn'          => $row['aprobado_en'],
            'aprobadoPor'         => $row['aprobado_por'],
            'imagenes'            => $imagenes[$id] ?? [],
            'categorias'          => $categorias[$id] ?? [],
        ];
    }, $rows);

    sendJsonResponse(200, [
        'negocios'        => $negocios,
        'total'           => $total,
        'totalPendientes' => $totalPendientes,
        'pagina'          => $pagina,
        'limite'          => $limite,
        'totalPaginas'    => (int)ceil($total / $limite),
    ]);
} catch (Exception $e) {
    error_log('Error en /api/admin/negocios.php: ' . $e->getMessage());
    sendJsonResponse(500, ['error' => 'Error al obtener negocios para administración.', 'codigo' => 'SERVER_ERROR']);
}

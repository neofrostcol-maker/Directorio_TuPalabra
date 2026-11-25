<?php
declare(strict_types=1);

/**
 * =====================================================================
 * API ADMIN: MÉTRICAS Y ESTADÍSTICAS DEL DASHBOARD (GET)
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

    // 1. Métricas generales de conteo
    $stmtCounts = $pdo->query('
        SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN estado = "pendiente" THEN 1 ELSE 0 END) AS pendientes,
            SUM(CASE WHEN estado = "aprobado" THEN 1 ELSE 0 END) AS aprobados,
            SUM(CASE WHEN estado = "rechazado" THEN 1 ELSE 0 END) AS rechazados
        FROM negocios
    ');
    $counts = $stmtCounts->fetch() ?: [];

    $metricas = [
        'total'      => (int)($counts['total'] ?? 0),
        'pendientes' => (int)($counts['pendientes'] ?? 0),
        'aprobados'  => (int)($counts['aprobados'] ?? 0),
        'rechazados' => (int)($counts['rechazados'] ?? 0),
    ];

    // 2. Registros por Categoría (Top 10)
    $stmtCat = $pdo->query('
        SELECT 
            c.id AS categoriaId,
            c.nombre,
            COUNT(nc.negocio_id) AS count
        FROM categorias c
        LEFT JOIN negocio_categorias nc ON c.id = nc.categoria_id
        GROUP BY c.id, c.nombre
        HAVING count > 0
        ORDER BY count DESC
        LIMIT 10
    ');
    $statsCategorias = $stmtCat->fetchAll();

    // 3. Registros por Mes (Últimos 6 meses para gráficas)
    $stmtMeses = $pdo->query('
        SELECT 
            DATE_FORMAT(creado_en, "%Y-%m") AS mes,
            DATE_FORMAT(creado_en, "%b %Y") AS etiqueta,
            COUNT(*) AS count
        FROM negocios
        WHERE creado_en >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY mes, etiqueta
        ORDER BY mes ASC
    ');
    $statsMeses = $stmtMeses->fetchAll();

    // 4. Últimos 5 pendientes para revisión inmediata en el dashboard
    $stmtPendientes = $pdo->query('
        SELECT 
            id, nombre_negocio AS nombreNegocio, tipo, telefono, correo, 
            responsable, creado_en AS creadoEn
        FROM negocios
        WHERE estado = "pendiente"
        ORDER BY creado_en DESC
        LIMIT 5
    ');
    $pendientesRecientes = $stmtPendientes->fetchAll();

    sendJsonResponse(200, [
        'metricas'            => $metricas,
        'statsCategorias'     => $statsCategorias,
        'statsMeses'          => $statsMeses,
        'pendientesRecientes' => $pendientesRecientes,
    ]);
} catch (Exception $e) {
    error_log('Error en /api/admin/metricas.php: ' . $e->getMessage());
    sendJsonResponse(500, ['error' => 'Error al obtener las métricas.', 'codigo' => 'SERVER_ERROR']);
}

<?php
declare(strict_types=1);

/**
 * =====================================================================
 * API ADMIN: REGISTRO DE AUDITORÍA Y SEGURIDAD (GET)
 * OWASP A09 (Security Logging and Monitoring)
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

    $accion = trim($_GET['accion'] ?? '');
    $pagina = max(1, (int)($_GET['pagina'] ?? 1));
    $limite = min(100, max(1, (int)($_GET['limite'] ?? 20)));
    $offset = ($pagina - 1) * $limite;

    $where = ['1=1'];
    $params = [];

    if ($accion !== '') {
        $where[] = 'accion = ?';
        $params[] = $accion;
    }

    $whereSql = implode(' AND ', $where);

    $stmtCount = $pdo->prepare("SELECT COUNT(*) FROM auditoria WHERE $whereSql");
    $stmtCount->execute($params);
    $total = (int)$stmtCount->fetchColumn();

    $stmt = $pdo->prepare("
        SELECT id, admin_id, usuario, accion, entidad, entidad_id, detalle, ip, user_agent, fecha
        FROM auditoria
        WHERE $whereSql
        ORDER BY fecha DESC
        LIMIT $limite OFFSET $offset
    ");
    $stmt->execute($params);
    $logs = $stmt->fetchAll();

    sendJsonResponse(200, [
        'logs'         => $logs,
        'total'        => $total,
        'pagina'       => $pagina,
        'limite'       => $limite,
        'totalPaginas' => (int)ceil($total / $limite),
    ]);
} catch (Exception $e) {
    error_log('Error en /api/admin/auditoria.php: ' . $e->getMessage());
    sendJsonResponse(500, ['error' => 'Error al consultar los registros de auditoría.', 'codigo' => 'SERVER_ERROR']);
}

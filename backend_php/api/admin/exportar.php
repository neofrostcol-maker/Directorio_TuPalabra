<?php
declare(strict_types=1);

/**
 * =====================================================================
 * API ADMIN: EXPORTAR REGISTROS A CSV / EXCEL (GET)
 * Incluye UTF-8 BOM para compatibilidad total con Excel en Windows y Mac.
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
    $busqueda = trim($_GET['q'] ?? '');

    $where = ['1=1'];
    $params = [];

    if ($estado !== '' && in_array($estado, ['pendiente', 'aprobado', 'rechazado'], true)) {
        $where[] = 'n.estado = ?';
        $params[] = $estado;
    }

    if ($busqueda !== '') {
        $where[] = '(n.nombre_negocio LIKE ? OR n.correo LIKE ? OR n.telefono LIKE ?)';
        $like = '%' . $busqueda . '%';
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
    }

    $whereSql = implode(' AND ', $where);

    $sql = "
        SELECT 
            n.id,
            n.tipo,
            n.nombre_negocio,
            n.direccion,
            n.telefono,
            n.correo,
            n.responsable,
            n.documento,
            n.ciudad,
            n.barrio,
            n.horario,
            n.promocion_miembros,
            CASE WHEN n.es_miembro_iglesia = 1 THEN 'Sí' ELSE 'No' END AS es_miembro,
            n.estado,
            n.motivo_rechazo,
            n.creado_en,
            n.aprobado_en,
            n.aprobado_por,
            GROUP_CONCAT(DISTINCT c.nombre ORDER BY c.nombre SEPARATOR '; ') AS categorias_nombres
        FROM negocios n
        LEFT JOIN negocio_categorias nc ON n.id = nc.negocio_id
        LEFT JOIN categorias c ON nc.categoria_id = c.id
        WHERE $whereSql
        GROUP BY n.id
        ORDER BY n.creado_en DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $registros = $stmt->fetchAll();

    // Auditoría de la exportación
    AuditLogger::log('exportar', 'negocios', null, "Exportación CSV generada (" . count($registros) . " registros)", $admin['id'], $admin['usuario']);

    // Nombre de archivo con fecha y hora de Colombia
    $fechaStr = date('Y-m-d_H-i');
    $fileName = "directorio_tupalabra_{$fechaStr}.csv";

    header('Content-Type: text/csv; charset=UTF-8');
    header("Content-Disposition: attachment; filename=\"{$fileName}\"");
    header('Pragma: no-cache');
    header('Expires: 0');

    // Salida directa
    $output = fopen('php://output', 'w');

    // CRÍTICO: UTF-8 BOM para que Microsoft Excel reconozca tildes en español
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

    // Cabeceras de columnas
    fputcsv($output, [
        'ID Negocio',
        'Tipo',
        'Nombre del Negocio',
        'Categorías',
        'Dirección',
        'Teléfono',
        'Correo Electrónico',
        'Responsable',
        'Documento (NIT/Cédula)',
        'Ciudad',
        'Barrio',
        'Horario',
        'Promoción Miembros',
        'Miembro Iglesia Tu Palabra',
        'Estado',
        'Motivo de Rechazo',
        'Fecha de Registro',
        'Fecha de Aprobación',
        'Aprobado Por',
    ]);

    // Filas de datos
    foreach ($registros as $row) {
        fputcsv($output, [
            $row['id'],
            $row['tipo'] === 'empresa' ? 'Empresa' : 'Persona Natural / Independiente',
            $row['nombre_negocio'],
            $row['categorias_nombres'] ?? '',
            $row['direccion'],
            $row['telefono'],
            $row['correo'],
            $row['responsable'] ?? '',
            $row['documento'] ?? '',
            $row['ciudad'] ?? '',
            $row['barrio'] ?? '',
            $row['horario'] ?? '',
            $row['promocion_miembros'] ?? '',
            $row['es_miembro'],
            ucfirst($row['estado']),
            $row['motivo_rechazo'] ?? '',
            $row['creado_en'],
            $row['aprobado_en'] ?? '',
            $row['aprobado_por'] ?? '',
        ]);
    }

    fclose($output);
    exit;
} catch (Exception $e) {
    error_log('Error en /api/admin/exportar.php: ' . $e->getMessage());
    sendJsonResponse(500, ['error' => 'Error al exportar los datos.', 'codigo' => 'EXPORT_ERROR']);
}

<?php
declare(strict_types=1);

/**
 * =====================================================================
 * HELPER DE AUDITORÍA Y TRAZABILIDAD (OWASP A09)
 * =====================================================================
 */

require_once dirname(__DIR__) . '/config/database.php';
require_once dirname(__DIR__) . '/config/security.php';

class AuditLogger
{
    /**
     * Registrar una acción administrativa o evento de seguridad
     */
    public static function log(
        string $accion,
        string $entidad,
        ?string $entidadId = null,
        ?string $detalle = null,
        ?string $adminId = null,
        ?string $usuario = null
    ): void {
        try {
            $pdo = getDBConnection();
            $id = generateUUIDv4();
            $ip = getClientIP();
            $ua = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255);

            $stmt = $pdo->prepare('
                INSERT INTO auditoria (id, admin_id, usuario, accion, entidad, entidad_id, detalle, ip, user_agent, fecha)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ');

            $stmt->execute([
                $id,
                $adminId,
                $usuario,
                $accion,
                $entidad,
                $entidadId,
                $detalle,
                $ip,
                $ua,
            ]);
        } catch (Exception $e) {
            // El fallo de auditoría no debe detener la ejecución pero debe quedar en log
            error_log('Error registrando auditoría: ' . $e->getMessage());
        }
    }
}

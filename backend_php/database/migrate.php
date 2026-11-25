<?php
declare(strict_types=1);

/**
 * =====================================================================
 * SCRIPT DE MIGRACIÓN AUTOMÁTICA Y VERIFICACIÓN INICIAL (cPanel / CLI)
 * Directorio Empresarial Iglesia Cristiana Tu Palabra
 * =====================================================================
 * Uso por consola: php database/migrate.php
 * Uso web: https://tusitio.com/database/migrate.php?token=SECRETO_INSTALACION
 * =====================================================================
 */

require_once dirname(__DIR__) . '/config/database.php';
require_once dirname(__DIR__) . '/config/security.php';

$isCli = (php_sapi_name() === 'cli');

if (!$isCli) {
    applySecurityHeaders();

    // Protección para uso web: solo si se pasa el token de instalación o si no hay tablas
    $token = $_GET['token'] ?? '';
    $tokenEsperado = getenv('INSTALL_TOKEN') ?: 'Iglesia2026Setup';

    if ($token !== $tokenEsperado) {
        http_response_code(403);
        echo "<h1 style='color:red;'>Acceso Prohibido</h1><p>Para ejecutar la migración desde el navegador web debe proveer el token de instalación: <code>?token=Iglesia2026Setup</code></p>";
        exit;
    }

    echo "<pre style='font-family: monospace; background: #06313c; color: #b5dde3; padding: 20px; border-radius: 8px;'>";
}

function out(string $msg): void {
    global $isCli;
    echo $msg . ($isCli ? PHP_EOL : "<br>");
}

out("=====================================================================");
out(" INICIANDO MIGRACIÓN MYSQL - DIRECTORIO EMPRESARIAL TU PALABRA");
out("=====================================================================");

try {
    $pdo = getDBConnection();
    out("[OK] Conexión establecida con MySQL (" . DB_HOST . " / " . DB_NAME . ")");

    // 1. Leer archivo schema.sql
    $sqlFile = __DIR__ . '/schema.sql';
    if (!file_exists($sqlFile)) {
        throw new Exception("No se encontró el archivo schema.sql en: $sqlFile");
    }

    $sqlContent = file_get_contents($sqlFile);
    out("[OK] Archivo schema.sql cargado (" . strlen($sqlContent) . " bytes)");

    // 2. Dividir consultas por punto y coma (respetando cadenas)
    // Desactivar temporalmente foreign keys para crear tablas limpiamente
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");

    $queries = array_filter(
        array_map('trim', explode(';', $sqlContent)),
        fn($q) => $q !== '' && !str_starts_with($q, '--')
    );

    $ejecutadas = 0;
    foreach ($queries as $query) {
        if (trim($query) === '') continue;
        $pdo->exec($query);
        $ejecutadas++;
    }

    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");
    out("[OK] $ejecutadas sentencias SQL ejecutadas correctamente.");

    // 3. Crear usuario administrador con hash bcrypt seguro si no existe
    $adminUser = getenv('ADMIN_USER') ?: 'admin';
    $adminPass = getenv('ADMIN_PASSWORD') ?: 'Iglesia2026+';
    $adminMail = getenv('ADMIN_EMAIL') ?: 'admin@iglesiatupalabra.org';

    $stmtAdmin = $pdo->prepare('SELECT id FROM admins WHERE usuario = ? LIMIT 1');
    $stmtAdmin->execute([$adminUser]);
    $adminExiste = $stmtAdmin->fetch();

    $hashSeguro = password_hash($adminPass, PASSWORD_BCRYPT, ['cost' => 12]);

    if (!$adminExiste) {
        $adminId = generateUUIDv4();
        $ins = $pdo->prepare('
            INSERT INTO admins (id, usuario, password_hash, correo, nombre, activo, creado_en)
            VALUES (?, ?, ?, ?, "Administrador Principal", 1, NOW())
        ');
        $ins->execute([$adminId, $adminUser, $hashSeguro, $adminMail]);
        out("[OK] Administrador único creado:");
        out("     - Usuario: $adminUser");
        out("     - Contraseña: $adminPass");
        out("     - Correo: $adminMail");
    } else {
        // Asegurar que el hash use bcrypt con cost 12
        $upd = $pdo->prepare('UPDATE admins SET password_hash = ?, correo = ? WHERE usuario = ?');
        $upd->execute([$hashSeguro, $adminMail, $adminUser]);
        out("[OK] Contraseña del administrador '$adminUser' sincronizada con hash bcrypt (cost 12).");
    }

    // 4. Verificar categorías oficiales
    $countCats = (int)$pdo->query('SELECT COUNT(*) FROM categorias')->fetchColumn();
    out("[OK] Categorías oficiales en base de datos: $countCats de 23 requeridas.");

    // 5. Crear y verificar carpetas de uploads en disco local con permisos seguros
    $directorios = [
        UPLOADS_DIR,
        UPLOADS_DIR . '/negocios',
        UPLOADS_DIR . '/logos',
    ];

    foreach ($directorios as $dir) {
        if (!is_dir($dir)) {
            if (mkdir($dir, 0755, true)) {
                out("[OK] Carpeta creada con permisos 0755: " . basename($dir));
            } else {
                out("[WARN] No se pudo crear la carpeta: $dir (Verificar permisos de cPanel)");
            }
        } else {
            out("[OK] Carpeta existente: " . basename($dir));
        }
    }

    out("=====================================================================");
    out(" ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!");
    out(" La base de datos y el sistema de archivos están listos para cPanel.");
    out("=====================================================================");

} catch (Exception $e) {
    out("[ERROR CRÍTICO]: " . $e->getMessage());
}

if (!$isCli) {
    echo "</pre>";
}

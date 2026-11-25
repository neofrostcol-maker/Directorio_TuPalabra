# 🏛️ Backend en PHP + MySQL para cPanel - Directorio Empresarial Tu Palabra
## Iglesia Cristiana Tu Palabra • *Un Encuentro de Gracia*

Este módulo contiene la implementación completa, modular y endurecida bajo las directrices de seguridad **OWASP Top 10** del backend y los servicios API en **PHP 8.1+ nativo con conexión PDO a MySQL**, diseñado específicamente para ser alojado en servidores **cPanel / Apache / LiteSpeed**.

---

## 📁 1. Estructura de Archivos y Carpetas

```text
backend_php/
├── .htaccess                     # Reglas de Apache, cabeceras OWASP, redirección limpia y compresión
├── config/
│   ├── database.php              # Conexión Singleton PDO MySQL (UTF-8 mb4, emulación desactivada)
│   ├── security.php              # Cabeceras HTTP, sesión endurecida, control de tasa (Rate Limiting)
│   ├── mailer.php                # Plantillas HTML oficiales (#0A5767) y notificaciones automáticas
│   └── config.sample.php         # Plantilla de credenciales para cPanel (renombrar a config.local.php)
├── database/
│   ├── schema.sql                # DDL completo MySQL (InnoDB, Foreign Keys CASCADE, 23 Categorías, Admin)
│   └── migrate.php               # Script de migración automática (vía consola CLI o navegador)
├── helpers/
│   ├── Auth.php                  # Autenticación segura, bcrypt cost 12, regeneración de sesión, logout
│   ├── FileUploader.php          # Subida segura de imágenes a disco local, validación MIME real y borrado
│   ├── Validator.php             # Validación de campos, regex teléfono Colombia, Honeypot anti-spam
│   └── AuditLogger.php           # Trazabilidad y auditoría de acciones administrativas en MySQL
├── uploads/                      # Carpeta de acceso público donde se guardan las fotos locales
│   ├── .htaccess                 # CRÍTICO OWASP: Desactiva ejecución de scripts PHP/phtml/cgi
│   ├── negocios/                 # Fotografías de negocios (UUID.jpg / UUID.webp)
│   └── logos/                    # Logotipos subidos
└── api/                          # Endpoints RESTful en formato JSON
    ├── categorias.php            # GET: Listado de las 23 categorías oficiales
    ├── negocios.php              # GET: Directorio público filtrado / POST: Registro de negocios
    ├── negocio.php               # GET: Detalle completo de un negocio por su ID
    ├── upload.php                # POST: Subida de imágenes al servidor local con retorno de URL
    └── admin/
        ├── login.php             # POST: Login con bloqueo tras 5 intentos fallidos
        ├── logout.php            # POST: Cierre seguro de sesión
        ├── me.php                # GET: Verificación de sesión de administrador
        ├── negocios.php          # GET: Panel de negocios con filtros, estado y documentos privados
        ├── negocio-aprobar.php   # POST: Aprobación individual + Notificación al solicitante
        ├── negocio-rechazar.php  # POST: Rechazo con motivo + Notificación al solicitante
        ├── negocio-eliminar.php  # POST/DELETE: Borrado en cascada + Eliminación física de fotos del disco
        ├── negocios-masivo.php   # POST: Aprobación, rechazo o eliminación en lote con limpieza de archivos
        ├── metricas.php          # GET: KPIs de aprobados/pendientes/rechazados, gráficos por categoría y mes
        ├── auditoria.php         # GET: Registro histórico de auditoría con paginación
        ├── exportar.php          # GET: Exportación a Excel/CSV con UTF-8 BOM
        └── cambiar-password.php  # POST: Cambio seguro de contraseña del admin
```

---

## 🛡️ 2. Implementación de Seguridad OWASP TOP 10

| Regla OWASP | Vulnerabilidad Prevenida | Implementación en este Backend |
| :--- | :--- | :--- |
| **A01: Broken Access Control** | Acceso no autorizado a rutas administrativas | Todas las rutas `/api/admin/*` validan sesión activa mediante `Auth::requireAdmin()`, caducidad a 8 horas y verificación de usuario activo en base de datos. |
| **A02: Cryptographic Failures** | Robo de contraseñas y tráfico interceptado | Contraseñas protegidas con `PASSWORD_BCRYPT` (costo 12). Forzado HSTS en `.htaccess` y cookies de sesión configuradas con `Secure`, `HttpOnly` y `SameSite=Lax`. |
| **A03: Injection** | Inyección SQL y XSS | Conexión PDO con `PDO::ATTR_EMULATE_PREPARES => false`. El 100% de consultas usan *Prepared Statements* parametrizados. Sanitización con `strip_tags` y `cleanString`. |
| **A04: Insecure Design** | Ataques de fuerza bruta y Spam bots | **Honeypot** (`website_trap`) en el formulario de registro para repeler bots. **Rate Limiting** persistente en tabla MySQL que bloquea por IP tras 5 intentos fallidos en login o saturación de subidas. |
| **A05: Security Misconfiguration** | Listado de directorios y ejecución de scripts | Archivo `uploads/.htaccess` que aplica `php_flag engine off` y deniega cualquier archivo `.php/.phtml/.cgi`. Archivo `.htaccess` raíz con `Options -Indexes` y cabeceras `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`. |
| **A07: Identification Failures** | Fijación de sesión y adivinación de credenciales | Regeneración de ID de sesión (`session_regenerate_id(true)`) al autenticar. Mensajes de error genéricos (*"Usuario o contraseña no válidos"*) para evitar enumeración. Bloqueo temporal por 15 minutos. |
| **A08: Software & Data Integrity** | Subida de Web Shells o archivos maliciosos | `FileUploader.php` valida la extensión contra lista blanca estricta (`jpg, jpeg, png, webp`), comprueba el tipo MIME real mediante Magic Bytes (`finfo`) e inspecciona la estructura gráfica con `getimagesize`. Los archivos se renombran obligatoriamente con UUIDv4. |
| **A09: Logging & Monitoring** | Falta de trazabilidad en incidentes | Tabla `auditoria` donde se registra cada aprobación, rechazo, eliminación, inicio de sesión, cambio de clave y exportación con usuario, IP, User Agent y marca de tiempo. |
| **A10: SSRF & Path Traversal** | Manipulación de rutas en disco | `FileUploader::deleteLocalFile()` valida con `realpath()` que el archivo a eliminar permanezca estrictamente dentro de la ruta canónica `UPLOADS_DIR`. |

---

## 🚀 3. Guía Paso a Paso para Montar en cPanel

### Paso 1: Crear la Base de Datos MySQL en cPanel
1. Inicia sesión en tu cuenta de **cPanel**.
2. Ve a la sección **Bases de Datos** y haz clic en **Asistente de Bases de Datos MySQL** (*MySQL Database Wizard*).
3. **Paso 1:** Asigna un nombre a la base de datos (ej. `tuusuario_directorio`).
4. **Paso 2:** Crea un usuario para la base de datos (ej. `tuusuario_admin`) y genera una contraseña segura (ej. `Iglesia2026+`).
5. **Paso 3:** En privilegios, marca la casilla **TODOS LOS PRIVILEGIOS** (*ALL PRIVILEGES*) y guarda los cambios.

### Paso 2: Importar la Estructura de la Base de Datos
Tienes dos opciones sencillas:
* **Opción A (Recomendada - phpMyAdmin):**
  1. En cPanel, abre **phpMyAdmin**.
  2. Selecciona en el menú izquierdo la base de datos recién creada (`tuusuario_directorio`).
  3. Haz clic en la pestaña superior **Importar**.
  4. Haz clic en **Seleccionar archivo** y elige `database/schema.sql`.
  5. Pulsa **Continuar**. Se crearán las 7 tablas, índices foráneos y las 23 categorías oficiales pre-sembradas.
* **Opción B (Automática por Navegador):**
  1. Sube los archivos al servidor.
  2. Visita en tu navegador: `https://tusitio.com/database/migrate.php?token=Iglesia2026Setup`.

### Paso 3: Subir los Archivos al Administrador de Archivos de cPanel
1. Entra a **Administrador de Archivos** en cPanel.
2. Ingresa a la carpeta pública: `public_html/` (o una subcarpeta como `public_html/directorio/`).
3. Sube el contenido de la carpeta `backend_php`.
4. Asegúrate de que el archivo `.htaccess` esté presente (en el Administrador de Archivos activa en *Configuración* -> *Mostrar archivos ocultos dotfiles*).

### Paso 4: Configurar Credenciales Locales
1. En la carpeta `config/`, copia o renombra `config.sample.php` como **`config.local.php`**.
2. Ábrelo con el editor de código de cPanel y coloca tus datos:
   ```php
   <?php
   define('DB_HOST', 'localhost');
   define('DB_PORT', '3306');
   define('DB_NAME', 'tuusuario_directorio');
   define('DB_USER', 'tuusuario_admin');
   define('DB_PASS', 'TuPasswordConfigurado2026+');
   define('APP_URL', 'https://tudominio.com');
   define('ADMIN_NOTIFICATION_EMAIL', 'admin@iglesiatupalabra.org');
   ```
3. Guarda el archivo. Este archivo tiene bloqueo de acceso web directo en el `.htaccess`.

### Paso 5: Permisos de Carpetas en cPanel
Verifica los permisos numéricos en el Administrador de Archivos:
* Carpetas generales: **`755`** (`drwxr-xr-x`).
* Archivos `.php` y `.htaccess`: **`644`** (`-rw-r--r--`).
* Carpeta `uploads/`, `uploads/negocios/` y `uploads/logos/`: **`755`** o **`775`** (para permitir que el usuario del servidor web de cPanel guarde las fotos).

### Paso 6: Credenciales Iniciales de Administrador
* **URL del Login:** `https://tudominio.com/admin/login` (o vía API `POST /api/admin/login.php`)
* **Usuario:** `admin`
* **Contraseña Inicial:** `Iglesia2026+` *(Puedes cambiarla en cualquier momento desde el panel o vía `/api/admin/cambiar-password.php`)*.

---

## 📸 4. Gestión de Imágenes y Eliminación Física
* Cuando un usuario registra un negocio o sube fotos, se almacenan en `uploads/negocios/` con nombres únicos generados criptográficamente (ej. `a3b1c8e9-4f2a-4c8e-9d2a-1b2c3d4e5f6a.jpg`).
* **Regla de oro:** Cuando el administrador elimina un negocio (individualmente o de forma masiva), el sistema invoca `FileUploader::deleteBusinessImages()`, el cual **elimina físicamente del disco de cPanel todas las fotografías y el logotipo asociado**, liberando espacio de almacenamiento y evitando acumulación de archivos huérfanos.

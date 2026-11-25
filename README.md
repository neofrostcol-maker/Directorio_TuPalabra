# Directorio Empresarial Tu Palabra 🏛️🕊️

Plataforma web oficial para la **Iglesia Cristiana Tu Palabra** (Colombia), diseñada para que los miembros de la congregación publiquen sus negocios, emprendimientos o servicios profesionales, y para que cualquier persona en Colombia pueda consultarlos y contactarlos directamente vía WhatsApp o llamada telefónica.

Enlace oficial de la iglesia: [instagram.com/iglesiatupalabra](https://www.instagram.com/iglesiatupalabra)

---

## 🌟 Características Principales

### 1. Directorio Público Abierto
- **Explorador y buscador dinámico**: Búsqueda por texto libre (nombre, actividad, productos, barrio, ciudad).
- **Filtros avanzados**: Por 23 categorías oficiales, tipo (Empresa o Persona Natural), ciudad y filtro especial *"Miembros de Iglesia Tu Palabra"*.
- **Tarjetas de negocios atractivas**: Foto principal, categorías (chips), insignia de verificación de congregación, descripción corta, beneficios/descuentos exclusivos para miembros y accesos directos de **WhatsApp (wa.me/57...)**, llamada directa y detalle.
- **Página de detalle de negocio (`/negocio/[id]`)**: Galería de fotos con carrusel y lightbox en pantalla completa, horario, trayectoria, canales de contacto, enlace directo a Google Maps según dirección y botón para compartir (Web Share API).
- **SEO y Open Graph**: Metadatos indexables, `sitemap.xml` dinámico y `robots.txt`.
- **Habeas Data (Ley 1581 de 2012)**: Política de tratamiento de datos personales y estricta confidencialidad de datos internos (cédula/NIT, IP y notas de moderación nunca son visibles públicamente).

### 2. Registro Público en 3 Pasos
- **Paso 1**: Selección del tipo de registro (*Empresa* o *Persona Natural*).
- **Paso 2**: Formulario validado con Zod y React Hook Form:
  - Nombre, dirección, teléfono/WhatsApp colombiano (10 dígitos, formato +57), correo electrónico.
  - Subida de **mínimo 3 y máximo 5 fotos del negocio** con compresión automática en el navegador (máx. 1600px), previsualización, reordenamiento y eliminación antes de enviar.
  - Subida opcional de logo, etiquetas de servicios destacados, redes sociales, catálogo digital y descuento para miembros de la iglesia.
- **Paso 3**: Selección estricta de **1 a 5 categorías** (bloqueo automático al llegar a 5, validado en backend y con Trigger SQL en BD), casilla obligatoria de autorización de datos personales y protección anti-spam (Honeypot + Rate Limit por IP).
- **Pantalla de confirmación con confeti**: *"Tu registro fue recibido y está pendiente de aprobación"*.

### 3. Panel de Administración Seguro (`/admin`)
- **Protección y Autenticación**: Sesión firmada con JWT (librería `jose`) y cookie `HttpOnly`, `Secure`, `SameSite=Strict` con expiración de 8 horas. Cifrado de contraseñas con **bcrypt (factor de trabajo 12)**.
- **Defensa contra ataques de fuerza bruta**: Bloqueo temporal automático tras 5 intentos fallidos consecutivos.
- **Dashboard Operativo**: Indicadores en tiempo real (pendientes, aprobados, rechazados, total) y gráficos de distribución por sector comercial.
- **Moderación Individual y Masiva**:
  - Aprobación individual con revisión de fotos y datos privados.
  - Rechazo con motivo obligatorio y notificación por correo.
  - Edición en caliente de cualquier dato del negocio.
  - Acciones masivas con selección múltiple (*Aprobar seleccionados*, *Rechazar con motivo*, *Eliminar*).
  - Eliminación segura con borrado sincronizado de imágenes en Vercel Blob.
- **Exportación a CSV**: Archivo delimitado por punto y coma con UTF-8 BOM, 100% compatible con Microsoft Excel en Colombia y Latinoamérica.
- **Pistas de Auditoría (`/admin/auditoria`)**: Registro histórico e inmutable de cada acción administrativa.
- **Gestión de Credenciales (`/admin/perfil`)**: Cambio seguro de contraseña del administrador.

---

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 15+ (App Router con Server Components y API Routes)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS + `tw-animate-css`
- **Base de Datos**: SQLite mediante **libSQL / Turso** (archivo local `file:./dev.db` en desarrollo y base en la nube en producción)
- **ORM**: Drizzle ORM con migraciones SQL versionadas
- **Almacenamiento de Imágenes**: Vercel Blob (`@vercel/blob`) con almacenamiento local de respaldo para desarrollo offline
- **Validaciones**: Zod (cliente y servidor)
- **Seguridad**: `jose` (JWT), `bcryptjs` (costo 12), Rate Limit in-memory
- **Iconografía**: `lucide-react`

---

## 🚀 Instalación y Puesta en Marcha Local

### 1. Clonar el repositorio e instalar dependencias

```bash
git clone <url-del-repositorio>
cd directorio-tu-palabra
npm install
```

### 2. Configurar variables de entorno

Copia el archivo de ejemplo:

```bash
cp .env.example .env.local
```

En desarrollo local no necesitas configurar Turso ni Vercel Blob si no lo deseas; el sistema usará automáticamente una base SQLite local (`dev.db`) y guardará las imágenes en `/public/uploads`.

### 3. Ejecutar migraciones y sembrar datos iniciales

```bash
# Aplica la migración inicial (tablas, índices y trigger de max 5 categorías)
npm run db:migrate

# Siembra las 23 categorías oficiales, el administrador único y negocios de muestra
npm run db:seed
```

### 4. Credenciales de acceso de Administrador

Por defecto (configuradas en `.env.example` y generadas por el seed):
- **URL**: `http://localhost:3000/admin/login`
- **Usuario**: `AdminTuPalabra`
- **Contraseña**: `Iglesia2026+`

*(Puedes cambiar el usuario y contraseña en tu archivo `.env.local` antes de correr el seed).*

### 5. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🧪 Pruebas Automatizadas

El proyecto incluye una suite de pruebas para las validaciones críticas:

```bash
npm run test
```

Pruebas verificadas:
1. Validación de fotos (exige entre 3 y 5 fotos obligatorias).
2. Validación de categorías (exige entre 1 y 5 categorías máximo).
3. Validación de teléfonos en Colombia (móviles 3xx y fijos de 10 dígitos, soporte prefijo +57).
4. Validación obligatoria de Habeas Data (Ley 1581 de 2012).
5. Hashing bcrypt con factor de trabajo 12.
6. Bloqueo de seguridad del login tras 5 intentos fallidos.

---

## ▲ Despliegue en Vercel como Demo (Cero Configuración)

La aplicación está preparada para publicarse **en 1 clic en Vercel como Demo funcional** sin necesidad de configurar bases de datos externas ni tokens previos:

1. Sube este repositorio a GitHub / GitLab / Bitbucket o ejecuta `npx vercel --prod`.
2. Importa el proyecto en [Vercel](https://vercel.com/new) (Framework Preset: **Next.js**).
3. Haz clic en **Deploy** (no es obligatorio añadir variables de entorno para la Demo).

### ¿Qué incluye el Modo Demo automático?
- **Base de datos SQLite efímera en `/tmp/dev.db` + Auto-Seed**: Si `TURSO_DATABASE_URL` no está configurada, el servidor copia/inicializa automáticamente la base en `/tmp/dev.db` con las **23 categorías oficiales**, el **administrador único** y **negocios de muestra** (aprobados y pendientes para probar el panel). *(Nota: en Serverless sin Turso, los registros nuevos duran mientras viva la instancia).*
- **Subida de imágenes sin Token**: Si `BLOB_READ_WRITE_TOKEN` no está configurado, las imágenes comprimidas se guardan automáticamente como Data URIs válidas para previsualización en la Demo.
- **URLs automáticas**: `robots.txt`, `sitemap.xml` y los metadatos Open Graph resuelven automáticamente el dominio asignado por Vercel (`VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_URL`).

---

## ☁️ Despliegue en Producción Persistente (Vercel + Turso + Blob)

Para conservar permanentemente todos los negocios e imágenes en producción:

### Paso 1: Crear Base de Datos en Turso

1. Crea una cuenta gratuita en [Turso](https://turso.tech).
2. Instala el CLI de Turso o usa la consola web y crea una base de datos:
   ```bash
   turso db create tupalabra-db
   ```
3. Obtén la URL de conexión y el token de autenticación:
   ```bash
   turso db show tupalabra-db --url
   turso db tokens create tupalabra-db
   ```

### Paso 2: Activar Vercel Blob

1. En el Dashboard de tu proyecto en [Vercel](https://vercel.com):
2. Ve a la pestaña **Storage** -> **Create Database** -> **Blob**.
3. Vercel inyectará automáticamente la variable `BLOB_READ_WRITE_TOKEN`.

### Paso 3: Configurar Variables de Entorno en Vercel

En **Settings** -> **Environment Variables** de tu proyecto en Vercel, agrega:

| Variable | Valor | Descripción |
|---|---|---|
| `TURSO_DATABASE_URL` | `libsql://tupalabra-db-...turso.io` | URL de tu base de datos Turso |
| `TURSO_AUTH_TOKEN` | `eyJhbGci...` | Token generado en Turso |
| `BLOB_READ_WRITE_TOKEN` | `vercel_blob_rw_...` | Generado automáticamente por Vercel Blob |
| `JWT_SECRET` | *(Cadena aleatoria de 32+ caracteres)* | Llave secreta para firmar cookies de sesión |
| `ADMIN_USER` | `AdminTuPalabra` | Usuario único del administrador |
| `ADMIN_PASSWORD` | `TuContraseñaSegura2026+` | Contraseña inicial del administrador |
| `ADMIN_EMAIL` | `jhocamolu2010@gmail.com` | Correo del administrador |
| `RESEND_API_KEY` | *(Opcional)* `re_...` | Para envío real de correos de notificación |
| `APP_URL` | *(Opcional)* `https://tu-dominio.vercel.app` | Dominio personalizado |

*(El esquema y el seed inicial también se aplican automáticamente si la base en Turso está vacía, o puedes ejecutarlos manualmente con `npm run db:migrate && npm run db:seed`).*

---

## 📂 Estructura del Proyecto

```text
├── app/
│   ├── api/
│   │   ├── admin/             # Rutas protegidas: login, logout, negocios, export, auditoría
│   │   ├── categorias/        # GET 23 categorías oficiales
│   │   ├── negocios/          # Directorio público y registro
│   │   └── upload/            # Subida de imágenes a Vercel Blob con validación de tipo y tamaño
│   ├── admin/                 # Panel de administración (Dashboard, Negocios, Detalle, Auditoría, Perfil)
│   ├── negocio/[id]/          # Perfil público con galería, Google Maps y contacto
│   ├── politica-de-privacidad/# Términos y Habeas Data (Ley 1581 de 2012)
│   ├── registro/              # Wizard de registro en 3 pasos con progreso
│   ├── layout.tsx             # Metadatos SEO, Open Graph y fuentes
│   ├── page.tsx               # Directorio empresarial público
│   ├── robots.ts              # SEO Robots
│   └── sitemap.ts             # Sitemap dinámico con negocios aprobados
├── components/
│   ├── AdminLayout.tsx        # Navegación del panel de control
│   ├── Footer.tsx             # Pie con versículo bíblico y datos de la iglesia
│   └── Navbar.tsx             # Barra superior con logo de Tu Palabra
├── drizzle/
│   └── 0000_initial_schema.sql# Migración SQL inicial con tablas, índices y trigger
├── lib/
│   ├── auth/                  # JWT (jose) y cookies seguras
│   ├── db/                    # Cliente LibSQL y esquema Drizzle ORM
│   ├── storage/               # Adaptador para Vercel Blob
│   ├── validations/           # Esquemas Zod (validación Colombia, teléfono, imágenes)
│   ├── email.ts               # Notificaciones por correo
│   └── rate-limit.ts          # Protección anti-fuerza bruta y rate limit
├── public/
│   └── logo-tupalabra.svg     # Logo vectorial oficial de la Iglesia Cristiana Tu Palabra
├── scripts/
│   ├── migrate.ts             # Ejecutor de migraciones SQL
│   └── seed.ts                # Sembrador idempotente (23 categorías y Admin)
├── tests/
│   └── validations.test.ts    # Suite de pruebas automatizadas
├── .env.example               # Plantilla de variables de entorno
└── package.json               # Dependencias y scripts
```

---

## 📜 Licencia & Derechos

Diseñado y construido para la gloria de Dios y al servicio de la comunidad de la **Iglesia Cristiana Tu Palabra** (Colombia).
*“Y todo lo que hagáis, hacedlo de corazón, como para el Señor y no para los hombres.”* (Colosenses 3:23)

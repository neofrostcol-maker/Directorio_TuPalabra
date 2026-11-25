<?php
declare(strict_types=1);

/**
 * =====================================================================
 * HELPER DE VALIDACIÓN Y SANITIZACIÓN DE DATOS (OWASP A03 & A04)
 * =====================================================================
 */

require_once dirname(__DIR__) . '/config/security.php';

class Validator
{
    // Regex oficial para teléfonos colombianos (celular o fijo, con o sin +57)
    public const REGEX_TELEFONO_COLOMBIA = '/^(\+?57)?[1-9]\d{9}$/';

    /**
     * Validar carga de registro de negocio
     */
    public static function validateNegocio(array $data, bool $isUpdate = false): array
    {
        $errores = [];

        // 1. Verificación Honeypot anti-spam (OWASP A04)
        if (!empty($data['website_trap'])) {
            // Un bot llenó el campo oculto
            sendJsonResponse(400, [
                'error' => 'Solicitud rechazada por detección de bot automatizado.',
                'codigo' => 'SPAM_DETECTED'
            ]);
        }

        // 2. Tipo de organización
        $tipo = $data['tipo'] ?? 'empresa';
        if (!in_array($tipo, ['empresa', 'persona_natural'], true)) {
            $errores['tipo'] = 'El tipo debe ser "empresa" o "persona_natural".';
        }

        // 3. Nombre del negocio
        $nombre = cleanString($data['nombreNegocio'] ?? $data['nombre_negocio'] ?? '', 200);
        if (mb_strlen($nombre) < 3) {
            $errores['nombreNegocio'] = 'El nombre del negocio o servicio debe tener al menos 3 caracteres.';
        }

        // 4. Dirección
        $direccion = cleanString($data['direccion'] ?? '', 255);
        if (mb_strlen($direccion) < 5) {
            $errores['direccion'] = 'La dirección es obligatoria (mínimo 5 caracteres).';
        }

        // 5. Teléfono
        $telefono = preg_replace('/[^\d+]/', '', (string)($data['telefono'] ?? ''));
        if (!preg_match(self::REGEX_TELEFONO_COLOMBIA, $telefono)) {
            $errores['telefono'] = 'Ingrese un teléfono de contacto válido en Colombia (10 dígitos o con +57).';
        }

        // 6. Correo electrónico
        $correo = filter_var(trim((string)($data['correo'] ?? '')), FILTER_VALIDATE_EMAIL);
        if (!$correo) {
            $errores['correo'] = 'Ingrese un correo electrónico válido.';
        }

        // 7. Descripciones
        $descCorta = cleanString($data['descripcionCorta'] ?? $data['descripcion_corta'] ?? '', 160);
        $descLarga = cleanString($data['descripcionLarga'] ?? $data['descripcion_larga'] ?? '', 1000);

        // 8. Ciudad y Barrio
        $ciudad = cleanString($data['ciudad'] ?? 'Bogotá', 100);
        $barrio = cleanString($data['barrio'] ?? '', 100);

        // 9. Documento (Privado)
        $documento = cleanString($data['documento'] ?? '', 60);

        // 10. Responsable
        $responsable = cleanString($data['responsable'] ?? '', 150);

        // 11. Redes Sociales y enlaces
        $sitioWeb = filter_var($data['sitioWeb'] ?? $data['sitio_web'] ?? '', FILTER_VALIDATE_URL) ?: null;
        $instagram = cleanString($data['instagram'] ?? '', 100);
        $facebook = cleanString($data['facebook'] ?? '', 150);
        $tiktok = cleanString($data['tiktok'] ?? '', 100);
        $catalogoUrl = filter_var($data['catalogoUrl'] ?? $data['catalogo_url'] ?? '', FILTER_VALIDATE_URL) ?: null;
        $horario = cleanString($data['horario'] ?? '', 150);
        $anioFundacion = cleanString($data['anioFundacion'] ?? $data['anio_fundacion'] ?? '', 10);
        $promocionMiembros = cleanString($data['promocionMiembros'] ?? $data['promocion_miembros'] ?? '', 500);
        $esMiembroIglesia = !empty($data['esMiembroIglesia'] ?? $data['es_miembro_iglesia'] ?? false) ? 1 : 0;
        $logoUrl = cleanString($data['logoUrl'] ?? $data['logo_url'] ?? '', 255) ?: null;

        // 12. Tipos de atención
        $tiposAtencion = is_array($data['tiposAtencion'] ?? null)
            ? array_values(array_filter($data['tiposAtencion'], 'is_string'))
            : ['local_fisico'];

        // 13. Servicios destacados
        $serviciosDestacados = is_array($data['serviciosDestacados'] ?? null)
            ? array_slice(array_map('cleanString', $data['serviciosDestacados']), 0, 10)
            : [];

        // 14. Categorías (1 a 5 obligatorias)
        $categoriasIds = $data['categoriasIds'] ?? $data['categorias_ids'] ?? [];
        if (!is_array($categoriasIds) || count($categoriasIds) < 1 || count($categoriasIds) > 5) {
            $errores['categorias'] = 'Debes seleccionar entre 1 y 5 categorías para clasificar tu negocio.';
        } else {
            $categoriasIds = array_map('intval', array_unique($categoriasIds));
        }

        // 15. Imágenes (3 a 5 obligatorias en registro nuevo)
        $imagenes = $data['imagenes'] ?? [];
        if (!$isUpdate && (!is_array($imagenes) || count($imagenes) < 3 || count($imagenes) > 5)) {
            $errores['imagenes'] = 'Debes subir entre 3 y 5 fotos representativas de tu negocio o servicio.';
        }

        // 16. Aceptación de datos (Habeas Data Colombia)
        if (!$isUpdate && empty($data['aceptaDatos'] ?? $data['acepta_datos'])) {
            $errores['aceptaDatos'] = 'Es obligatorio aceptar la Política de Tratamiento de Datos Personales (Ley 1581 de 2012).';
        }

        if (!empty($errores)) {
            sendJsonResponse(400, [
                'error' => 'Por favor verifique los campos del formulario.',
                'errores' => $errores,
                'codigo' => 'VALIDATION_FAILED'
            ]);
        }

        return [
            'tipo'                 => $tipo,
            'nombre_negocio'       => $nombre,
            'direccion'            => $direccion,
            'telefono'             => $telefono,
            'correo'               => $correo,
            'descripcion_corta'    => $descCorta ?: null,
            'descripcion_larga'    => $descLarga ?: null,
            'responsable'          => $responsable ?: null,
            'documento'            => $documento ?: null,
            'ciudad'               => $ciudad ?: 'Bogotá',
            'barrio'               => $barrio ?: null,
            'sitio_web'            => $sitioWeb,
            'instagram'            => $instagram ?: null,
            'facebook'             => $facebook ?: null,
            'tiktok'               => $tiktok ?: null,
            'catalogo_url'         => $catalogoUrl,
            'horario'              => $horario ?: null,
            'anio_fundacion'       => $anioFundacion ?: null,
            'tipos_atencion'       => json_encode($tiposAtencion, JSON_UNESCAPED_UNICODE),
            'servicios_destacados' => json_encode($serviciosDestacados, JSON_UNESCAPED_UNICODE),
            'promocion_miembros'   => $promocionMiembros ?: null,
            'es_miembro_iglesia'   => $esMiembroIglesia,
            'logo_url'             => $logoUrl,
            'categorias_ids'       => $categoriasIds,
            'imagenes'             => $imagenes,
        ];
    }
}

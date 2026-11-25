<?php
declare(strict_types=1);

/**
 * =====================================================================
 * SERVICIO DE NOTIFICACIONES POR CORREO (cPanel / PHP Native Mail & SMTP)
 * Directorio Empresarial Iglesia Cristiana Tu Palabra
 * =====================================================================
 */

defined('MAIL_FROM_ADDRESS') || define('MAIL_FROM_ADDRESS', getenv('MAIL_FROM_ADDRESS') ?: 'no-reply@iglesiatupalabra.org');
defined('MAIL_FROM_NAME')    || define('MAIL_FROM_NAME', getenv('MAIL_FROM_NAME') ?: 'Directorio Empresarial Tu Palabra');
defined('ADMIN_NOTIFICATION_EMAIL') || define('ADMIN_NOTIFICATION_EMAIL', getenv('ADMIN_EMAIL') ?: 'admin@iglesiatupalabra.org');

/**
 * Enviar correo en formato HTML responsivo con identidad oficial de la iglesia
 *
 * @param string $para Dirección de destino
 * @param string $asunto Asunto del mensaje
 * @param string $cuerpoHtml Contenido HTML del cuerpo
 * @return bool
 */
function sendEmailTuPalabra(string $para, string $asunto, string $cuerpoHtml): bool
{
    // Limpieza de cabeceras para prevenir Email Header Injection (OWASP A03)
    $para = filter_var(trim($para), FILTER_SANITIZE_EMAIL);
    if (!filter_var($para, FILTER_VALIDATE_EMAIL)) {
        error_log("Dirección de correo no válida: $para");
        return false;
    }

    $asuntoLimpio = str_replace(["\r", "\n"], '', trim($asunto));

    // Plantilla visual oficial con los colores del Manual de Marca (#0A5767)
    $htmlCompleto = <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{$asuntoLimpio}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fbfb; margin: 0; padding: 20px; color: #2d3748; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #d8edf0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #06313c 0%, #0a5767 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 2px; font-weight: 800; }
    .header p { margin: 4px 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2.5px; color: #b5dde3; }
    .body-content { padding: 32px 24px; line-height: 1.6; font-size: 14px; }
    .card-info { background-color: #f0f8f9; border-left: 4px solid #0a5767; padding: 16px; border-radius: 8px; margin: 20px 0; }
    .footer { background-color: #031e25; color: #87c4cf; padding: 24px; text-align: center; font-size: 11px; line-height: 1.5; }
    .footer a { color: #ffffff; text-decoration: underline; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge-approved { background-color: #d1fae5; color: #065f46; }
    .badge-rejected { background-color: #fee2e2; color: #991b1b; }
    .btn { display: inline-block; background-color: #0a5767; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 13px; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Directorio Empresarial</h1>
      <p>Iglesia Cristiana Tu Palabra • Un Encuentro de Gracia</p>
    </div>
    <div class="body-content">
      {$cuerpoHtml}
    </div>
    <div class="footer">
      <p><strong>Iglesia Cristiana Tu Palabra</strong> • Colombia</p>
      <p>«Encomienda a Jehová tus obras, y tus pensamientos serán afirmados.» — Proverbios 16:3</p>
      <p>Este es un mensaje automático de notificación institucional.</p>
    </div>
  </div>
</body>
</html>
HTML;

    // Cabeceras RFC 2822
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'From: ' . sprintf('=?UTF-8?B?%s?= <%s>', base64_encode(MAIL_FROM_NAME), MAIL_FROM_ADDRESS),
        'Reply-To: ' . MAIL_FROM_ADDRESS,
        'X-Mailer: PHP/' . phpversion(),
        'X-Auto-Response-Suppress: All',
    ];

    try {
        return mail($para, '=?UTF-8?B?' . base64_encode($asuntoLimpio) . '?=', $htmlCompleto, implode("\r\n", $headers));
    } catch (Exception $e) {
        error_log('Error enviando correo: ' . $e->getMessage());
        return false;
    }
}

/**
 * Notificar al Administrador de un nuevo registro
 */
function notifyAdminNuevoNegocio(array $negocio): bool
{
    $asunto = 'Nuevo registro en Directorio: ' . $negocio['nombre_negocio'];
    $tipoLabel = $negocio['tipo'] === 'empresa' ? 'Empresa' : 'Persona Natural / Independiente';
    $miembro = !empty($negocio['es_miembro_iglesia']) ? 'Sí (Miembro de la Iglesia)' : 'No registrado como congregante';
    $adminUrl = APP_URL . '/admin';

    $cuerpo = <<<HTML
    <h2 style="color: #0a5767; margin-top: 0;">¡Se ha recibido una nueva solicitud de registro!</h2>
    <p>Un emprendedor o empresa ha completado el formulario de inscripción y espera tu revisión y aprobación:</p>

    <div class="card-info">
      <p><strong>Nombre del Negocio:</strong> {$negocio['nombre_negocio']}</p>
      <p><strong>Tipo de Registro:</strong> {$tipoLabel}</p>
      <p><strong>Contacto / Teléfono:</strong> {$negocio['telefono']}</p>
      <p><strong>Correo electrónico:</strong> {$negocio['correo']}</p>
      <p><strong>Ciudad / Barrio:</strong> {$negocio['ciudad']} - {$negocio['barrio']}</p>
      <p><strong>Congregante Tu Palabra:</strong> {$miembro}</p>
    </div>

    <p style="text-align: center;">
      <a href="{$adminUrl}" class="btn">Ingresar al Panel de Administración</a>
    </p>
HTML;

    return sendEmailTuPalabra(ADMIN_NOTIFICATION_EMAIL, $asunto, $cuerpo);
}

/**
 * Notificar al solicitante que su negocio ha sido APROBADO
 */
function notifyUsuarioAprobado(array $negocio): bool
{
    $asunto = '¡Tu negocio ha sido publicado en el Directorio Tu Palabra!';
    $urlNegocio = APP_URL . '/negocio/' . $negocio['id'];

    $cuerpo = <<<HTML
    <h2 style="color: #0a5767; margin-top: 0;">¡Buenas noticias, {$negocio['nombre_negocio']}!</h2>
    <p><span class="badge badge-approved">Registro Aprobado</span></p>
    <p>Nos alegra informarte que tu registro en el <strong>Directorio Empresarial de la Iglesia Cristiana Tu Palabra</strong> ha sido revisado y <strong>aprobado con éxito</strong>.</p>
    
    <p>A partir de este momento, los miembros de la congregación y el público general pueden encontrar tu información, galería de fotos, ubicación y contactarte directamente por WhatsApp.</p>

    <div class="card-info">
      <p><strong>Negocio:</strong> {$negocio['nombre_negocio']}</p>
      <p><strong>Estado:</strong> Activo y visible públicamente</p>
      <p><strong>Teléfono registrado:</strong> {$negocio['telefono']}</p>
    </div>

    <p style="text-align: center;">
      <a href="{$urlNegocio}" class="btn">Ver mi negocio en el Directorio</a>
    </p>

    <p>Oramos para que el Señor prospere tu labor y continúe bendiciendo tus manos y talentos.</p>
HTML;

    return sendEmailTuPalabra($negocio['correo'], $asunto, $cuerpo);
}

/**
 * Notificar al solicitante que su registro ha sido RECHAZADO
 */
function notifyUsuarioRechazado(array $negocio, string $motivo): bool
{
    $asunto = 'Actualización sobre tu solicitud en el Directorio Tu Palabra';
    $motivoHtml = nl2br(htmlspecialchars($motivo, ENT_QUOTES, 'UTF-8'));

    $cuerpo = <<<HTML
    <h2 style="color: #991b1b; margin-top: 0;">Actualización de tu solicitud</h2>
    <p><span class="badge badge-rejected">Solicitud no aprobada</span></p>
    <p>Te agradecemos tu interés en formar parte del <strong>Directorio Empresarial Tu Palabra</strong>.</p>
    
    <p>Tras revisar los datos de tu solicitud para <strong>{$negocio['nombre_negocio']}</strong>, el equipo administrativo determinó que no cumple temporalmente con los criterios requeridos:</p>

    <div class="card-info" style="border-left-color: #dc2626; background-color: #fef2f2;">
      <p><strong>Motivo especificado por el administrador:</strong></p>
      <p style="color: #991b1b;">{$motivoHtml}</p>
    </div>

    <p>Puedes corregir los datos o comunicarte con la administración de la iglesia para cualquier duda o volver a enviar tu registro una vez subsanada la observación.</p>
HTML;

    return sendEmailTuPalabra($negocio['correo'], $asunto, $cuerpo);
}

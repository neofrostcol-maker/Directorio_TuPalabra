interface EnviarEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function enviarEmail({ to, subject, html }: EnviarEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[SIMULACIÓN EMAIL] Para: ${to} | Asunto: ${subject}`);
    return true;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'Directorio Tu Palabra <notificaciones@tupalabra.org>',
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Error enviando correo con Resend:', errorText);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error de conexión con Resend:', error);
    return false;
  }
}

/**
 * Notifica al administrador sobre un nuevo negocio recibido
 */
export async function notificarNuevoRegistroAdmin(negocio: {
  nombreNegocio: string;
  responsable?: string | null;
  correo: string;
  telefono: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || 'jhocamolu2010@gmail.com';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #1e40af;">Nuevo Negocio Registrado</h2>
      <p>Se ha recibido una nueva solicitud de registro en el <strong>Directorio Empresarial Tu Palabra</strong>:</p>
      <ul>
        <li><strong>Negocio:</strong> ${negocio.nombreNegocio}</li>
        <li><strong>Responsable:</strong> ${negocio.responsable || 'No especificado'}</li>
        <li><strong>Teléfono:</strong> ${negocio.telefono}</li>
        <li><strong>Correo:</strong> ${negocio.correo}</li>
      </ul>
      <p>Por favor ingresa al panel de administración para revisarlo y aprobarlo.</p>
      <div style="margin-top: 25px;">
        <a href="${process.env.APP_URL || 'http://localhost:3000'}/admin" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Ir al Panel de Administración</a>
      </div>
    </div>
  `;
  return await enviarEmail({
    to: adminEmail,
    subject: `Nuevo registro pendiente: ${negocio.nombreNegocio}`,
    html,
  });
}

/**
 * Notifica al solicitante sobre la aprobación de su negocio
 */
export async function notificarAprobacionNegocio(negocio: {
  nombreNegocio: string;
  correo: string;
  id: string;
}) {
  const urlNegocio = `${process.env.APP_URL || 'http://localhost:3000'}/negocio/${negocio.id}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #16a34a;">¡Tu negocio ha sido aprobado! 🎉</h2>
      <p>Estimado(a) emprendedor(a),</p>
      <p>Nos alegra informarte que <strong>${negocio.nombreNegocio}</strong> ha sido revisado y aprobado exitosamente en el <strong>Directorio Empresarial Tu Palabra</strong>.</p>
      <p>Tu negocio ya está visible para toda la congregación y el público general.</p>
      <div style="margin-top: 25px; margin-bottom: 25px;">
        <a href="${urlNegocio}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Ver mi negocio en el Directorio</a>
      </div>
      <p style="color: #6b7280; font-size: 13px;">Que Dios bendiga grandemente el fruto de tus manos y tu emprendimiento. "Encomienda a Jehová tus obras, y tus pensamientos serán afirmados." (Proverbios 16:3)</p>
    </div>
  `;
  return await enviarEmail({
    to: negocio.correo,
    subject: `¡Felicidades! Tu negocio "${negocio.nombreNegocio}" está publicado en Tu Palabra`,
    html,
  });
}

/**
 * Notifica al solicitante sobre el rechazo de su registro con el motivo
 */
export async function notificarRechazoNegocio(negocio: {
  nombreNegocio: string;
  correo: string;
  motivoRechazo?: string;
}) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #dc2626;">Actualización sobre tu solicitud</h2>
      <p>Hola,</p>
      <p>Te escribimos en relación a tu solicitud de publicación de <strong>${negocio.nombreNegocio}</strong> en el Directorio Empresarial Tu Palabra.</p>
      <p>Tras la revisión, tu solicitud no pudo ser aprobada por el siguiente motivo:</p>
      <blockquote style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 15px 0; color: #991b1b;">
        ${negocio.motivoRechazo || 'Información incompleta o no cumple con las políticas del directorio.'}
      </blockquote>
      <p>Puedes corregir la información y enviar una nueva solicitud cuando lo desees.</p>
      <p style="color: #6b7280; font-size: 13px;">Iglesia Cristiana Tu Palabra</p>
    </div>
  `;
  return await enviarEmail({
    to: negocio.correo,
    subject: `Estado de tu registro en Directorio Tu Palabra: ${negocio.nombreNegocio}`,
    html,
  });
}

import { z } from 'zod';

export const loginSchema = z.object({
  usuario: z.string().min(1, 'Ingresa tu nombre de usuario.'),
  password: z.string().min(1, 'Ingresa tu contraseña.'),
});

export const cambioPasswordSchema = z
  .object({
    passwordActual: z.string().min(1, 'Ingresa tu contraseña actual.'),
    nuevoPassword: z
      .string()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres.')
      .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula.')
      .regex(/[0-9]/, 'Debe incluir al menos un número.')
      .regex(/[^A-Za-z0-9]/, 'Debe incluir al menos un carácter especial.'),
    confirmarPassword: z.string().min(1, 'Confirma la nueva contraseña.'),
  })
  .refine((data) => data.nuevoPassword === data.confirmarPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmarPassword'],
  });

export const actualizarEstadoSchema = z
  .object({
    estado: z.enum(['pendiente', 'aprobado', 'rechazado']),
    motivoRechazo: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.estado === 'rechazado' && (!data.motivoRechazo || data.motivoRechazo.trim().length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: 'Debes indicar el motivo del rechazo para informar al solicitante.',
      path: ['motivoRechazo'],
    }
  );

export const accionMasivaSchema = z
  .object({
    ids: z.array(z.string().uuid()).min(1, 'Selecciona al menos un registro.'),
    accion: z.enum(['aprobar', 'rechazar', 'eliminar']),
    motivoRechazo: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.accion === 'rechazar' && (!data.motivoRechazo || data.motivoRechazo.trim().length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: 'Debes indicar el motivo del rechazo.',
      path: ['motivoRechazo'],
    }
  );

export const editarNegocioAdminSchema = z.object({
  nombreNegocio: z.string().min(2),
  tipo: z.enum(['empresa', 'persona_natural']),
  direccion: z.string().min(5),
  telefono: z.string().min(7),
  correo: z.string().email(),
  descripcionCorta: z.string().max(160).optional().nullable(),
  descripcionLarga: z.string().max(1000).optional().nullable(),
  responsable: z.string().max(100).optional().nullable(),
  documento: z.string().max(50).optional().nullable(),
  ciudad: z.string().max(80).optional().nullable(),
  barrio: z.string().max(100).optional().nullable(),
  sitioWeb: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  tiktok: z.string().optional().nullable(),
  catalogoUrl: z.string().optional().nullable(),
  horario: z.string().optional().nullable(),
  anioFundacion: z.string().optional().nullable(),
  tiposAtencion: z.array(z.string()).default([]),
  serviciosDestacados: z.array(z.string()).default([]),
  promocionMiembros: z.string().optional().nullable(),
  esMiembroIglesia: z.boolean().default(false),
  categoriasIds: z.array(z.number()).min(1).max(5),
});

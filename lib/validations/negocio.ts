import { z } from 'zod';

// Regex para validar formato de teléfono/WhatsApp en Colombia:
// Permite: 3001234567, +573001234567, 573001234567, (300) 123-4567, +57 300 123 4567, 6012345678 (fijo nacional)
export const REGEX_TELEFONO_COLOMBIA = /^(?:\+?57\s?)?(?:3\d{9}|60\d{8}|\d{10})$/;

export function normalizarTelefonoColombia(tel: string): string {
  // Limpia caracteres no numéricos excepto el + inicial
  const limpio = tel.replace(/[^\d+]/g, '');
  if (limpio.startsWith('+57')) {
    return limpio;
  }
  if (limpio.startsWith('57') && limpio.length === 12) {
    return '+' + limpio;
  }
  if (limpio.length === 10) {
    return '+57' + limpio;
  }
  return limpio;
}

export const registroNegocioSchema = z.object({
  // Paso 1: Tipo
  tipo: z.enum(['empresa', 'persona_natural'], {
    message: 'Debes seleccionar el tipo de registro (Empresa o Persona natural).',
  }),

  // Paso 2: Datos obligatorios
  nombreNegocio: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(120, 'El nombre no puede exceder 120 caracteres.'),
  direccion: z
    .string()
    .min(5, 'Ingresa una dirección válida (ej. Calle 85 # 15-20).')
    .max(200, 'La dirección no puede exceder 200 caracteres.'),
  telefono: z
    .string()
    .min(7, 'Ingresa un número de teléfono o WhatsApp válido.')
    .refine((val) => {
      const limpio = val.replace(/[\s\-()]/g, '');
      return REGEX_TELEFONO_COLOMBIA.test(limpio);
    }, 'El teléfono debe ser un número válido en Colombia (10 dígitos, ej. 3101234567 o +573101234567).'),
  correo: z
    .string()
    .email('Ingresa un correo electrónico válido.')
    .max(120, 'El correo no puede exceder 120 caracteres.'),

  // Fotos obligatorias: Mínimo 3, máximo 5
  imagenes: z
    .array(z.string().url('URL de imagen no válida'))
    .min(3, 'Debes incluir un mínimo de 3 fotos del negocio o de tus productos/servicios.')
    .max(5, 'Solo puedes incluir un máximo de 5 fotos del negocio.'),

  // Paso 2: Datos opcionales
  descripcionCorta: z
    .string()
    .max(160, 'La descripción corta no puede exceder 160 caracteres.')
    .optional()
    .or(z.literal('')),
  descripcionLarga: z
    .string()
    .max(1000, 'La descripción completa no puede exceder 1000 caracteres.')
    .optional()
    .or(z.literal('')),
  responsable: z
    .string()
    .max(100, 'El nombre del responsable no puede exceder 100 caracteres.')
    .optional()
    .or(z.literal('')),
  documento: z
    .string()
    .max(50, 'El documento no puede exceder 50 caracteres.')
    .optional()
    .or(z.literal('')), // NIT o cédula (privado)
  ciudad: z
    .string()
    .max(80, 'La ciudad no puede exceder 80 caracteres.')
    .optional()
    .or(z.literal('')),
  barrio: z
    .string()
    .max(100, 'El barrio o localidad no puede exceder 100 caracteres.')
    .optional()
    .or(z.literal('')),
  sitioWeb: z
    .string()
    .url('Ingresa una URL válida (con http:// o https://)')
    .optional()
    .or(z.literal('')),
  instagram: z
    .string()
    .max(80, 'El usuario o enlace de Instagram es demasiado largo.')
    .optional()
    .or(z.literal('')),
  facebook: z
    .string()
    .max(120, 'El enlace de Facebook es demasiado largo.')
    .optional()
    .or(z.literal('')),
  tiktok: z
    .string()
    .max(80, 'El usuario o enlace de TikTok es demasiado largo.')
    .optional()
    .or(z.literal('')),
  catalogoUrl: z
    .string()
    .url('Ingresa un enlace válido de catálogo')
    .optional()
    .or(z.literal('')),
  horario: z
    .string()
    .max(150, 'El horario no puede exceder 150 caracteres.')
    .optional()
    .or(z.literal('')),
  anioFundacion: z
    .string()
    .max(50, 'El año de fundación o experiencia no puede exceder 50 caracteres.')
    .optional()
    .or(z.literal('')),
  tiposAtencion: z
    .array(z.enum(['local_fisico', 'a_domicilio', 'en_linea']))
    .default([]),
  serviciosDestacados: z
    .array(z.string().max(40, 'Cada etiqueta no puede exceder 40 caracteres.'))
    .max(10, 'Máximo 10 servicios o productos destacados.')
    .default([]),
  promocionMiembros: z
    .string()
    .max(300, 'La promoción no puede exceder 300 caracteres.')
    .optional()
    .or(z.literal('')),
  esMiembroIglesia: z.boolean().default(false),
  logoUrl: z
    .string()
    .url('El logo debe ser una URL válida.')
    .optional()
    .or(z.literal('')),

  // Paso 3: Categorías (Mínimo 1, máximo 5)
  categoriasIds: z
    .array(z.number().int().positive())
    .min(1, 'Debes seleccionar al menos 1 categoría para tu negocio.')
    .max(5, 'Puedes seleccionar como máximo 5 categorías.'),

  // Habeas Data obligatorio
  aceptaDatos: z.literal(true, {
    message: 'Debes autorizar el tratamiento de datos personales conforme a la Ley 1581 de 2012 para continuar.',
  }),

  // Honeypot anti-spam (debe ser string vacío)
  website_trap: z.string().max(0, 'Spam detectado.').optional().or(z.literal('')),

  // Turnstile token opcional
  turnstileToken: z.string().optional(),
});

export type RegistroNegocioInput = z.infer<typeof registroNegocioSchema>;

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

interface LoginAttemptRecord {
  failedAttempts: number;
  lockedUntil: number;
}

const registroLimits = new Map<string, RateLimitRecord>();
const loginAttempts = new Map<string, LoginAttemptRecord>();

// Limpiador periódico de memoria cada 10 minutos
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of registroLimits.entries()) {
    if (now > value.resetAt) {
      registroLimits.delete(key);
    }
  }
  for (const [key, value] of loginAttempts.entries()) {
    if (now > value.lockedUntil && value.failedAttempts === 0) {
      loginAttempts.delete(key);
    }
  }
}, 10 * 60 * 1000);

if (typeof cleanupTimer.unref === 'function') {
  cleanupTimer.unref();
}

/**
 * Rate limit para registro de negocios: máximo 5 registros por hora por IP
 */
export function verificarLimiteRegistro(ip: string): { permitido: boolean; restante: number; esperaMinutos?: number } {
  const now = Date.now();
  const unaHora = 60 * 60 * 1000;
  const maxPermitidos = 5;

  const record = registroLimits.get(ip);
  if (!record || now > record.resetAt) {
    registroLimits.set(ip, { count: 1, resetAt: now + unaHora });
    return { permitido: true, restante: maxPermitidos - 1 };
  }

  if (record.count >= maxPermitidos) {
    const esperaMinutos = Math.ceil((record.resetAt - now) / 60000);
    return { permitido: false, restante: 0, esperaMinutos };
  }

  record.count += 1;
  return { permitido: true, restante: maxPermitidos - record.count };
}

/**
 * Rate limit y bloqueo para login de administrador:
 * Máximo 5 intentos fallidos antes de un bloqueo de 15 minutos.
 */
export function verificarBloqueoLogin(identifier: string): { bloqueado: boolean; minutosRestantes?: number } {
  const now = Date.now();
  const attempt = loginAttempts.get(identifier);

  if (!attempt) {
    return { bloqueado: false };
  }

  if (now < attempt.lockedUntil) {
    const minutosRestantes = Math.ceil((attempt.lockedUntil - now) / 60000);
    return { bloqueado: true, minutosRestantes };
  }

  // Si ya pasó el bloqueo, reseteamos si fue liberado
  if (attempt.lockedUntil > 0 && now >= attempt.lockedUntil) {
    loginAttempts.delete(identifier);
  }

  return { bloqueado: false };
}

export function registrarIntentoLoginFallido(identifier: string): { bloqueadoAhora: boolean; intentosRestantes: number } {
  const now = Date.now();
  const bloqueoDuracion = 15 * 60 * 1000; // 15 minutos
  const maxIntentos = 5;

  let attempt = loginAttempts.get(identifier);
  if (!attempt || (attempt.lockedUntil > 0 && now >= attempt.lockedUntil)) {
    attempt = { failedAttempts: 0, lockedUntil: 0 };
  }

  attempt.failedAttempts += 1;

  if (attempt.failedAttempts >= maxIntentos) {
    attempt.lockedUntil = now + bloqueoDuracion;
    loginAttempts.set(identifier, attempt);
    return { bloqueadoAhora: true, intentosRestantes: 0 };
  }

  loginAttempts.set(identifier, attempt);
  return { bloqueadoAhora: false, intentosRestantes: maxIntentos - attempt.failedAttempts };
}

export function resetearIntentosLogin(identifier: string) {
  loginAttempts.delete(identifier);
}

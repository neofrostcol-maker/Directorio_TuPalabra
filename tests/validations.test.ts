import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import { registroNegocioSchema, normalizarTelefonoColombia } from '../lib/validations/negocio';
import { loginSchema } from '../lib/validations/admin';
import {
  registrarIntentoLoginFallido,
  verificarBloqueoLogin,
  resetearIntentosLogin,
} from '../lib/rate-limit';

async function runTests() {
  console.log('🧪 Iniciando pruebas de validaciones críticas...\n');

  let passed = 0;
  let total = 0;

  function test(nombre: string, fn: () => void | Promise<void>) {
    total++;
    try {
      const res = fn();
      if (res instanceof Promise) {
        return res
          .then(() => {
            console.log(`  ✅ [PASS] ${nombre}`);
            passed++;
          })
          .catch((err) => {
            console.error(`  ❌ [FAIL] ${nombre}:`, err.message);
          });
      } else {
        console.log(`  ✅ [PASS] ${nombre}`);
        passed++;
      }
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${nombre}:`, err.message);
    }
  }

  // --- 1. PRUEBAS DE IMÁGENES (3 a 5 obligatorias) ---
  const baseValidPayload = {
    tipo: 'empresa' as const,
    nombreNegocio: 'Mi Negocio de Prueba',
    direccion: 'Carrera 15 # 80-20',
    telefono: '3101234567',
    correo: 'prueba@tupalabra.org',
    imagenes: [
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/601',
      'https://picsum.photos/800/602',
    ],
    categoriasIds: [1, 2],
    aceptaDatos: true as const,
  };

  test('Validación de imágenes: debe aceptar entre 3 y 5 fotos', () => {
    // 3 imágenes: válido
    const result3 = registroNegocioSchema.safeParse(baseValidPayload);
    assert.strictEqual(result3.success, true, 'Debe aceptar 3 imágenes');

    // 5 imágenes: válido
    const result5 = registroNegocioSchema.safeParse({
      ...baseValidPayload,
      imagenes: [
        'https://picsum.photos/800/600',
        'https://picsum.photos/800/601',
        'https://picsum.photos/800/602',
        'https://picsum.photos/800/603',
        'https://picsum.photos/800/604',
      ],
    });
    assert.strictEqual(result5.success, true, 'Debe aceptar 5 imágenes');
  });

  test('Validación de imágenes: debe rechazar menos de 3 fotos', () => {
    const result2 = registroNegocioSchema.safeParse({
      ...baseValidPayload,
      imagenes: [
        'https://picsum.photos/800/600',
        'https://picsum.photos/800/601',
      ],
    });
    assert.strictEqual(result2.success, false, 'No debe aceptar 2 imágenes');
  });

  test('Validación de imágenes: debe rechazar más de 5 fotos', () => {
    const result6 = registroNegocioSchema.safeParse({
      ...baseValidPayload,
      imagenes: [
        'https://picsum.photos/800/600',
        'https://picsum.photos/800/601',
        'https://picsum.photos/800/602',
        'https://picsum.photos/800/603',
        'https://picsum.photos/800/604',
        'https://picsum.photos/800/605',
      ],
    });
    assert.strictEqual(result6.success, false, 'No debe aceptar 6 imágenes');
  });

  // --- 2. PRUEBAS DE CATEGORÍAS (1 a 5 obligatorias) ---
  test('Validación de categorías: debe aceptar entre 1 y 5 categorías', () => {
    const result1 = registroNegocioSchema.safeParse({
      ...baseValidPayload,
      categoriasIds: [1],
    });
    assert.strictEqual(result1.success, true, 'Debe aceptar 1 categoría');

    const result5 = registroNegocioSchema.safeParse({
      ...baseValidPayload,
      categoriasIds: [1, 2, 3, 4, 5],
    });
    assert.strictEqual(result5.success, true, 'Debe aceptar 5 categorías');
  });

  test('Validación de categorías: debe rechazar 0 categorías', () => {
    const result0 = registroNegocioSchema.safeParse({
      ...baseValidPayload,
      categoriasIds: [],
    });
    assert.strictEqual(result0.success, false, 'No debe aceptar 0 categorías');
  });

  test('Validación de categorías: debe rechazar más de 5 categorías', () => {
    const result6 = registroNegocioSchema.safeParse({
      ...baseValidPayload,
      categoriasIds: [1, 2, 3, 4, 5, 6],
    });
    assert.strictEqual(result6.success, false, 'No debe aceptar más de 5 categorías');
  });

  // --- 3. PRUEBAS DE TELÉFONO COLOMBIA ---
  test('Validación de teléfono colombiano (+57 / 10 dígitos)', () => {
    const normal = normalizarTelefonoColombia('3101234567');
    assert.strictEqual(normal, '+573101234567');

    const conPrefijo = normalizarTelefonoColombia('+573209876543');
    assert.strictEqual(conPrefijo, '+573209876543');

    // Validación en schema
    const valido = registroNegocioSchema.safeParse({
      ...baseValidPayload,
      telefono: '3154448899',
    });
    assert.strictEqual(valido.success, true);

    const invalido = registroNegocioSchema.safeParse({
      ...baseValidPayload,
      telefono: '12345',
    });
    assert.strictEqual(invalido.success, false);
  });

  // --- 4. PRUEBAS DE AUTORIZACIÓN HABEAS DATA ---
  test('Validación de aceptación de datos personales Ley 1581', () => {
    const sinAceptar = registroNegocioSchema.safeParse({
      ...baseValidPayload,
      aceptaDatos: false,
    });
    assert.strictEqual(sinAceptar.success, false, 'No debe permitir enviar sin autorizar datos');
  });

  // --- 5. PRUEBAS DE ADMIN LOGIN Y BLOQUEO TRAS 5 INTENTOS ---
  await test('Admin: Verificación de hash bcrypt con costo 12', async () => {
    const passwordOriginal = 'Iglesia2026+';
    const hash = await bcrypt.hash(passwordOriginal, 12);
    const coincide = await bcrypt.compare(passwordOriginal, hash);
    const noCoincide = await bcrypt.compare('PasswordErronea', hash);

    assert.strictEqual(coincide, true, 'Bcrypt debe verificar la contraseña correcta');
    assert.strictEqual(noCoincide, false, 'Bcrypt debe rechazar la contraseña incorrecta');
  });

  test('Admin: Bloqueo tras 5 intentos fallidos de login', () => {
    const testIp = 'ip-test-lockout';
    resetearIntentosLogin(testIp);

    // 4 intentos fallidos: no bloqueado aún
    for (let i = 1; i <= 4; i++) {
      const intento = registrarIntentoLoginFallido(testIp);
      assert.strictEqual(intento.bloqueadoAhora, false, `Intento ${i} no debe bloquear`);
    }

    // 5to intento fallido: debe bloquearse
    const intento5 = registrarIntentoLoginFallido(testIp);
    assert.strictEqual(intento5.bloqueadoAhora, true, 'El 5to intento fallido debe activar el bloqueo');

    // Verificar estado de bloqueo
    const estado = verificarBloqueoLogin(testIp);
    assert.strictEqual(estado.bloqueado, true, 'Debe permanecer bloqueado');

    // Limpiar al terminar prueba
    resetearIntentosLogin(testIp);
  });

  console.log(`\n🎉 Pruebas finalizadas: ${passed} de ${total} pasaron exitosamente.`);
  if (passed !== total) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Error ejecutando suite de pruebas:', err);
  process.exit(1);
});

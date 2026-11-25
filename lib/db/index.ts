import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

declare global {
  var __libsql_client: ReturnType<typeof createClient> | undefined;
}

function resolverUrlLibsql(): string {
  const envUrl = process.env.TURSO_DATABASE_URL?.trim();
  if (envUrl) {
    return envUrl;
  }

  const localDbPath = path.join(process.cwd(), 'dev.db');
  const tmpDbPath = '/tmp/dev.db';

  // En Vercel Serverless (/var/task) el sistema de archivos es de solo lectura.
  // Copiamos dev.db a /tmp/dev.db para permitir escritura completa en el Modo Demo.
  let cwdEsEscribible = true;
  if (process.env.VERCEL === '1') {
    cwdEsEscribible = false;
  } else {
    try {
      fs.accessSync(process.cwd(), fs.constants.W_OK);
    } catch {
      cwdEsEscribible = false;
    }
  }

  if (!cwdEsEscribible) {
    try {
      if (!fs.existsSync(tmpDbPath) && fs.existsSync(localDbPath)) {
        fs.copyFileSync(localDbPath, tmpDbPath);
      }
      return `file:${tmpDbPath}`;
    } catch (err) {
      console.warn('No se pudo copiar dev.db a /tmp, intentando crear en /tmp:', err);
      return `file:${tmpDbPath}`;
    }
  }

  return 'file:./dev.db';
}

const url = resolverUrlLibsql();
const authToken = process.env.TURSO_AUTH_TOKEN?.trim() || undefined;

const client =
  global.__libsql_client ||
  createClient({
    url,
    authToken,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__libsql_client = client;
}

export const db = drizzle(client, { schema });
export { client };

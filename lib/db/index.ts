import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

declare global {
  var __libsql_client: ReturnType<typeof createClient> | undefined;
}

const url = process.env.TURSO_DATABASE_URL || 'file:./dev.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = global.__libsql_client || createClient({
  url,
  authToken: authToken || undefined,
});

if (process.env.NODE_ENV !== 'production') {
  global.__libsql_client = client;
}

export const db = drizzle(client, { schema });
export { client };

import fs from 'node:fs';
import path from 'node:path';
import { client } from '../lib/db';

async function runMigrations() {
  console.log('Iniciando migraciones de base de datos...');
  
  const migrationFile = path.join(process.cwd(), 'drizzle', '0000_initial_schema.sql');
  if (!fs.existsSync(migrationFile)) {
    console.error(`Archivo de migración no encontrado: ${migrationFile}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(migrationFile, 'utf8');

  // Dividir por declaraciones respetando los bloques de TRIGGER BEGIN ... END;
  const statements: string[] = [];
  let current = '';
  let inTrigger = false;

  for (const line of sqlContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('--')) {
      continue;
    }

    current += line + '\n';

    if (trimmed.toUpperCase().includes('CREATE TRIGGER')) {
      inTrigger = true;
    }

    if (inTrigger) {
      if (trimmed.toUpperCase() === 'END;') {
        statements.push(current.trim());
        current = '';
        inTrigger = false;
      }
    } else {
      if (trimmed.endsWith(';')) {
        statements.push(current.trim());
        current = '';
      }
    }
  }

  if (current.trim()) {
    statements.push(current.trim());
  }

  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await client.execute(statement);
      } catch (error) {
        console.error('Error ejecutando migración:', statement, error);
        throw error;
      }
    }
  }

  console.log('✅ Migraciones aplicadas exitosamente.');
}

runMigrations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fallo en las migraciones:', err);
    process.exit(1);
  });

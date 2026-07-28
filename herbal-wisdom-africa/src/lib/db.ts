// Herbal Wisdom Africa — data access layer (libsql/SQLite).
import { createClient, type Client, type InValue } from '@libsql/client';
import { readFileSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

declare global {
  // eslint-disable-next-line no-var
  var __hwaDb: Client | undefined;
  // eslint-disable-next-line no-var
  var __hwaDbReady: Promise<void> | undefined;
}

function makeClient(): Client {
  const url = process.env.DATABASE_URL || `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`;
  return createClient({
    url: url.startsWith('file:./') ? `file:${path.join(process.cwd(), url.slice(7))}` : url,
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  });
}

export const db: Client = globalThis.__hwaDb ?? (globalThis.__hwaDb = makeClient());

async function ensureSchema(): Promise<void> {
  const ddl = readFileSync(path.join(process.cwd(), 'prisma', 'schema.sql'), 'utf8');
  const statements = ddl.split(';').map((s) => s.trim()).filter(Boolean);
  for (const s of statements) {
    await db.execute(s);
  }
}

export function ready(): Promise<void> {
  return (globalThis.__hwaDbReady ??= ensureSchema());
}

type Row = Record<string, any>;

export async function all<T = Row>(sql: string, args: InValue[] = []): Promise<T[]> {
  await ready();
  const res = await db.execute({ sql, args });
  return res.rows as unknown as T[];
}

export async function get<T = Row>(sql: string, args: InValue[] = []): Promise<T | null> {
  const rows = await all<T>(sql, args);
  return rows[0] ?? null;
}

export async function run(sql: string, args: InValue[] = []): Promise<void> {
  await ready();
  await db.execute({ sql, args });
}

export async function insert(table: string, data: Row): Promise<string> {
  const id = (data.id as string) ?? randomUUID();
  const row: Row = { id, ...data };
  const keys = Object.keys(row);
  const cols = keys.map((k) => `"${k}"`).join(', ');
  const marks = keys.map(() => '?').join(', ');
  const vals = keys.map((k) => {
    const v = row[k];
    if (typeof v === 'boolean') return v ? 1 : 0;
    return v as InValue;
  });
  await run(`INSERT INTO ${table} (${cols}) VALUES (${marks})`, vals);
  return id;
}

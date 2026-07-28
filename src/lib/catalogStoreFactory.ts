// Shared server-only data access factory for admin-editable equipment
// catalogs (solar/electric-fence/CCTV). Never import from a 'use client'
// component — it touches the DB layer.
import { all, insert, run } from './db';

export type FieldKind = 'string' | 'number' | 'boolean' | 'json';
export interface FieldSpec {
  name: string;
  kind: FieldKind;
}

function toBool(v: unknown): boolean {
  return v === 1 || v === true || v === '1';
}

function rowToRecord<T>(row: Record<string, unknown>, fields: FieldSpec[]): T & { active: boolean } {
  const out: Record<string, unknown> = { id: row.id, active: toBool(row.active) };
  for (const f of fields) {
    const v = row[f.name];
    out[f.name] = f.kind === 'boolean' ? toBool(v) : f.kind === 'json' ? JSON.parse(String(v)) : v;
  }
  return out as T & { active: boolean };
}

function recordToRow(data: Record<string, unknown>, fields: FieldSpec[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (!(f.name in data)) continue;
    const v = data[f.name];
    out[f.name] = f.kind === 'boolean' ? (v ? 1 : 0) : f.kind === 'json' ? JSON.stringify(v) : v;
  }
  if ('active' in data) out.active = data.active ? 1 : 0;
  return out;
}

export function makeCatalogStore<T extends { id: string }>(table: string, fields: FieldSpec[]) {
  return {
    async list(includeInactive = false): Promise<(T & { active: boolean })[]> {
      const rows = await all<Record<string, unknown>>(
        `SELECT * FROM ${table} ${includeInactive ? '' : 'WHERE active = 1'} ORDER BY brand, model`
      );
      return rows.map((r) => rowToRecord<T>(r, fields));
    },
    async create(data: Omit<T, 'id'> & { active?: boolean }): Promise<string> {
      const row = recordToRow({ ...data, active: data.active ?? true }, fields);
      return insert(table, row);
    },
    async update(id: string, data: Partial<Omit<T, 'id'>> & { active?: boolean }): Promise<void> {
      const row = recordToRow(data, fields);
      const keys = Object.keys(row);
      if (keys.length === 0) return;
      await run(`UPDATE ${table} SET ${keys.map((k) => `"${k}" = ?`).join(', ')} WHERE id = ?`, [
        ...keys.map((k) => row[k] as never),
        id,
      ]);
    },
    async remove(id: string): Promise<void> {
      await run(`DELETE FROM ${table} WHERE id = ?`, [id]);
    },
  };
}

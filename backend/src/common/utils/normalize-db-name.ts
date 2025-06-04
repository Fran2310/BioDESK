// /src/common/utils/normalize-db-name.ts
/**
 * Normaliza el nombre de una base de datos agregando el prefijo 'lab_' si no lo tiene
 * y reemplazando los espacios por guiones bajos.
 *
 * @param raw - Nombre original de la base de datos.
 * @returns Nombre normalizado de la base de datos.
 */
export function normalizeDbName(raw: string): string {
  if (typeof raw !== 'string') return raw;

  let name = raw.trim().replace(/\s+/g, '_');

  if (!name.startsWith('lab_')) {
    name = `lab_${name}`;
  }

  return name;
}
